import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

async function main() {
  const srcSvg = path.resolve(process.cwd(), 'public', 'icons', 'icon.svg')
  const outDir = path.resolve(process.cwd(), 'public', 'icons')
  if (!fs.existsSync(srcSvg)) {
    console.error('Source SVG not found:', srcSvg)
    process.exit(0)
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const sizes = [192, 512]
  const svgBuffer = fs.readFileSync(srcSvg)
  await Promise.all(
    sizes.map(async (size) => {
      const out = path.join(outDir, `icon-${size}.png`)
      await sharp(svgBuffer, { density: 384 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(out)
    })
  )
  console.log('Generated PNG icons:', sizes.map(s => `icon-${s}.png`).join(', '))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

