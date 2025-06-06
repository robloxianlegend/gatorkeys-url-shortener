let links = {}

export default async function handler(req, res) {
  const code = req.query.code || req.url.split('/').pop()
  if (!code || !links[code]) return res.status(404).send('not found')

  res.writeHead(302, { Location: links[code] })
  res.end()
}
