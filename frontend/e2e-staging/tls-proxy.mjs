// Isolated loopback test proxy. Generates its key at runtime; no key is committed.
import https from 'node:https'
import http from 'node:http'
import net from 'node:net'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const openssl = process.platform === 'win32' && existsSync('C:/Program Files/Git/usr/bin/openssl.exe') ? 'C:/Program Files/Git/usr/bin/openssl.exe' : 'openssl'
const parent = process.platform === 'win32' ? join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : tmpdir()
const directory = mkdtempSync(join(parent, 'banaras-phase8-tls-'))
const key = join(directory, 'key.pem'), cert = join(directory, 'cert.pem')
const result = spawnSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' })
if (result.status !== 0) { rmSync(directory, { recursive: true, force: true }); throw new Error('Local HTTPS test needs OpenSSL; no public certificate is being tested') }
const server = https.createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
  const upstream = http.request({ hostname: '127.0.0.1', port: 3102, method: req.method, path: req.url, headers: req.headers }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res) })
  upstream.on('error', () => { res.writeHead(502); res.end('Local upstream unavailable') })
  req.pipe(upstream)
})
server.on('upgrade', (req, socket, head) => {
  const upstream = net.connect(3102, '127.0.0.1', () => {
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${req.rawHeaders.reduce((all, value, i) => all + (i % 2 ? `${value}\r\n` : `${value}: `), '')}\r\n`)
    if (head.length) upstream.write(head)
    socket.pipe(upstream).pipe(socket)
  })
  socket.on('error', () => upstream.destroy()); upstream.on('error', () => socket.destroy())
  socket.on('close', () => upstream.destroy()); upstream.on('close', () => socket.destroy())
})
server.listen(5176, '127.0.0.1')
process.once('exit', () => rmSync(directory, { recursive: true, force: true }))
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.closeAllConnections(); server.close(); process.exit(0) })
