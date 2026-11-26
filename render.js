// Renderiza um post da Rodada (JSON) em 3 slides JPEG 1080x1350.
// Uso: node render.js rodada/2026-11-26/01.json
// Saída: rodada/2026-11-26/01/1.jpg, 2.jpg, 3.jpg
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { slides } = require('./templates');

function chromePath() {
  const cands = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  const p = cands.find((c) => fs.existsSync(c));
  if (!p) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');
  return p;
}

async function render(jsonPath) {
  const post = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const outDir = jsonPath.replace(/\.json$/, '');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    const htmls = slides(post);
    const files = [];
    for (let i = 0; i < htmls.length; i++) {
      await page.setContent(htmls[i], { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      if (i === 0) {
        const fotoQuebrada = await page.evaluate(() => {
          const img = document.getElementById('foto');
          return img ? !(img.complete && img.naturalWidth > 0) : false;
        });
        if (fotoQuebrada) {
          console.warn(`AVISO: foto da capa não carregou (${post.capa.foto_url}). Usando capa tipográfica.`);
          await page.setContent(slides(post, { forcarTexto: true })[0], { waitUntil: 'load', timeout: 60000 });
          await page.evaluate(() => document.fonts.ready);
        }
      }
      const overflow = await page.evaluate(() => {
        const el = document.querySelector('[data-slide]');
        return el.scrollHeight > 1350 || el.scrollWidth > 1080;
      });
      if (overflow) console.warn(`AVISO: slide ${i + 1} de ${jsonPath} estourou 1080x1350. Encurte o texto.`);
      const file = path.join(outDir, `${i + 1}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
      files.push(file);
    }
    console.log(files.join('\n'));
    return files;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node render.js <post.json> [...]');
    process.exit(1);
  }
  (async () => {
    for (const a of args) await render(a);
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { render };
