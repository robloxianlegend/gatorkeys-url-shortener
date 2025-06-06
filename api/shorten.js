import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://apwdxzejpatyqqzmenet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2R4emVqcGF0eXFxemV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDA1NDcsImV4cCI6MjA2NDc3NjU0N30.AY-bd2b3OGCtmJVjYSUxWtqcJjNmL9H5tOctL1sIyO8'
)

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' })
      }

      const data = await req.json()

      const { url } = data
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid URL' })
      }

      try {
        new URL(url)
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' })
      }

      let code
      for (let i = 0; i < 5; i++) {
        code = Math.random().toString(36).substring(2, 8)
        const { data: existing, error: selectError } = await supabase
          .from('links')
          .select('code')
          .eq('code', code)
          .single()
        if (selectError && !selectError.message.includes('No rows found')) {
          console.error('DB select error:', selectError)
          return res.status(500).json({ error: 'Database error' })
        }
        if (!existing) break
        if (i === 4) return res.status(500).json({ error: 'Failed to generate unique code' })
      }

      const { error: insertError } = await supabase.from('links').insert([{ code, url }])
      if (insertError) {
        console.error('DB insert error:', insertError)
        return res.status(500).json({ error: 'Failed to store link' })
      }

      return res.status(200).json({ short: `https://shower.gatorkeys.xyz/${code}` })
    }

    if (req.method === 'GET') {
      // Expect code as query param or from URL path (next.js api routes usually only have query)
      const code = req.query.code || null

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
