// Renderiza um post da Rodada (JSON) em 3 slides JPEG 1080x1350.
// Uso: node render.js rodada/2026-11-26/01.json
// Saída: rodada/2026-11-26/01/1.jpg, 2.jpg, 3.jpg
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { slides, dims } = require('./templates');

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

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' };

async function render(jsonPath) {
  const post = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const outDir = jsonPath.replace(/\.json$/, '');
  fs.mkdirSync(outDir, { recursive: true });
  // Fotos baixadas pelo foto.js viram data URI (sem depender de rede no render).
  for (const f of post.fotos || []) {
    if (!f.arquivo) continue;
    const p = path.join(path.dirname(jsonPath), f.arquivo);
    if (!fs.existsSync(p)) continue;
    const ext = path.extname(p).slice(1).toLowerCase();
    f.src = `data:${MIME[ext] || 'image/jpeg'};base64,${fs.readFileSync(p).toString('base64')}`;
  }
  if (!(post.fotos || []).some((f) => f.src)) throw new Error(`${jsonPath}: sem foto baixada. Rode node foto.js primeiro. Post sem foto não é publicado.`);
  for (const velho of fs.readdirSync(outDir).filter((x) => /^\d+\.jpe?g$/i.test(x))) fs.unlinkSync(path.join(outDir, velho));
  const browser = await puppeteer.launch({
    executablePath: chromePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  try {
    const page = await browser.newPage();
    const { w: LW, h: LH } = dims(post);
    await page.setViewport({ width: LW, height: LH, deviceScaleFactor: 1 });
    const htmls = slides(post);
    const files = [];
    for (let i = 0; i < htmls.length; i++) {
      await page.setContent(htmls[i], { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const quebrada = await page.evaluate(() => [...document.images].some((img) => !(img.complete && img.naturalWidth > 0)));
      if (quebrada) throw new Error(`${jsonPath}: foto não carregou no slide ${i + 1}.`);
      const overflow = await page.evaluate((LH) => {
        const el = document.querySelector('[data-slide]');
        if (el.scrollHeight > LH || el.scrollWidth > 1080) return true;
        // Blocos de texto: não podem passar da área reservada; a capa não pode subir até o logo.
        if ([...el.querySelectorAll('[data-box]')].some((n) => n.scrollHeight > n.clientHeight + 2)) return true;
        const capa = el.querySelector('[data-capa]');
        return !!capa && capa.getBoundingClientRect().top < 170;
      });
      if (overflow) console.warn(`AVISO: slide ${i + 1} de ${jsonPath} estourou o tamanho do slide. Encurte o texto.`);
      const file = path.join(outDir, `${i + 1}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: LW, height: LH } });
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

module.exports = { render, chromePath };
