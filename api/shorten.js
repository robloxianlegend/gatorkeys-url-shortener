import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://apwdxzejpatyqqzmenet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwd2R4emVqcGF0eXFxem1lbmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDA1NDcsImV4cCI6MjA2NDc3NjU0N30.AY-bd2b3OGCtmJVjYSUxWtqcJjNmL9H5tOctL1sIyO8'
)

export default async function handler(req, res) {
  if (req.url === '/favicon.ico') {
    return res.status(204).end()
  }

  try {
    if (req.method === 'POST') {
      const { url } = req.body
      if (!url) return res.status(400).json({ error: 'Missing URL' })

      const code = Math.random().toString(36).substring(2, 8)

      const { error } = await supabase.from('links').insert([{ code, url }])
      if (error) return res.status(500).json({ error: 'Failed to store link' })

      return res.status(200).json({ short: `https://shower.gatorkeys.xyz/${code}` })
    }

    if (req.method === 'GET') {
      const code = req.query.code
      if (!code) return res.status(400).json({ error: 'Missing code' })

      const { data, error } = await supabase.from('links').select('url').eq('code', code).single()
      if (error || !data) return res.status(404).send('Not found')

      res.writeHead(302, { Location: data.url })
      res.end()
      return
    }

    res.status(405).end()
  } catch (e) {
    console.error('API error:', e)
    res.status(500).json({ error: e.message || 'Internal Server Error' })
  }
}
