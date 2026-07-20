// Gera os ícones do PWA. Este arquivo é a fonte do desenho — mexeu aqui, roda `npm run icons`.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// câmera minimal na paleta champagne/ivory do app
const MARK = `
  <g fill="none" stroke="#fdfbf7" stroke-width="18" stroke-linejoin="round" stroke-linecap="round">
    <path d="M212 176 l16 -34 h56 l16 34" />
    <rect x="116" y="176" width="280" height="196" rx="34" />
    <circle cx="256" cy="276" r="62" />
  </g>
  <circle cx="256" cy="276" r="24" fill="#fdfbf7" />
  <circle cx="342" cy="222" r="11" fill="#fdfbf7" />`

const BACKGROUND = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c5a878" />
      <stop offset="1" stop-color="#97744a" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" />`

function svg(inner) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${inner}</svg>`,
  )
}

const icon = svg(BACKGROUND + MARK)

// maskable: o launcher pode recortar até 20% de cada borda, então o desenho
// entra reduzido a 72% e centralizado, dentro da safe zone
const maskable = svg(
  `${BACKGROUND}<g transform="translate(71.68 71.68) scale(0.72)">${MARK}</g>`,
)

await mkdir(publicDir, { recursive: true })

const targets = [
  { name: 'pwa-192.png', size: 192, input: icon },
  { name: 'pwa-512.png', size: 512, input: icon },
  { name: 'apple-touch-icon.png', size: 180, input: icon },
  { name: 'favicon-32.png', size: 32, input: icon },
  { name: 'pwa-maskable-512.png', size: 512, input: maskable },
]

for (const { name, size, input } of targets) {
  await sharp(input, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toFile(join(publicDir, name))
  console.log(`gerado public/${name} (${size}px)`)
}

await writeFile(join(publicDir, 'favicon.svg'), icon)
console.log('gerado public/favicon.svg')
