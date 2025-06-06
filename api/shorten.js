import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://apwdxzejpatyqqzmenet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2R4emVqcGF0eXFxemVlbmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDA1NDcsImV4cCI6MjA2NDc3NjU0N30.AY-bd2b3OGCtmJVjYSUxWtqcJjNmL9H5tOctL1sIyO8'
)

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' })
      }

      let body = ''
      for await (const chunk of req) body += chunk

      let data
      try {
        data = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: 'Invalid JSON' })
      }

      const { url } = data
      if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing or invalid URL' })

      // Basic URL validation
      try {
        new URL(url)
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' })
      }

      // Generate unique 6-char code, retry if collision
      let code
      for (let i = 0; i < 5; i++) {
        code = Math.random().toString(36).substring(2, 8)
        const { data: existing } = await supabase.from('links').select('code').eq('code', code).single()
        if (!existing) break
        if (i === 4) return res.status(500).json({ error: 'Failed to generate unique code' })
      }

      const { error } = await supabase.from('links').insert([{ code, url }])
      if (error) {
        console.error('DB insert error:', error)
        return res.status(500).json({ error: 'Failed to store link' })
      }

      return res.status(200).json({ short: `https://shower.gatorkeys.xyz/${code}` })
    }

    if (req.method === 'GET') {
      let code = req.query.code
      if (!code) {
        const urlParts = req.url.split('/')
        code = urlParts[urlParts.length - 1] || null
      }
      if (!code) return res.status(400).json({ error: 'Missing code' })

      const { data, error } = await supabase.from('links').select('url').eq('code', code).single()
      if (error || !data) return res.status(404).send('Not found')

      res.writeHead(302, { Location: data.url })
      res.end()
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API unexpected error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
