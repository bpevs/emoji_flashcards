/*
 * Serve the emoji_flashcards website
 */
import { join } from 'https://deno.land/std@0.200.0/path/posix.ts'

const server = Deno.listen({ port: 8080 })
console.log('File server running on http://localhost:8080/')

for await (const conn of server) {
  handleHttp(conn).catch(console.error)
}

async function handleHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn)
  for await (const requestEvent of httpConn) {
    const url = new URL(requestEvent.request.url)
    const filepath = decodeURIComponent(url.pathname)

    let file
    try {
      const filepath = join('./www', decodeURIComponent(url.pathname))
      const fileData = await Deno.stat(filepath)
      if (!fileData.isFile) throw new Error('Not a file')
      file = await Deno.open(filepath, { read: true })
    } catch {
      file = await Deno.open('./www/index.html', { read: true })
    }

    await requestEvent.respondWith(new Response(file.readable))
  }
}
