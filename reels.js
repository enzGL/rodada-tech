// Gera o Reels (MP4 1080x1920) de um post v4 da Rodada.
// Uso: node reels.js rodada/2026-11-27/01.json
// Saída: rodada/2026-11-27/01/reel.mp4 (+ cenas em 01/reel/).
// Cenas = capa, cada slide e a assinatura (templates.reelSlides). Cada cena ganha um zoom lento,
// transição curta e tempo de leitura proporcional ao texto. Sem narração (a chave do ElevenLabs
// não está na nuvem); trilha muda AAC para compatibilidade. Estratégia aprovada pelo Enzo em 2026-11-26.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');
const { reelSlides } = require('./templates');
const { chromePath } = require('./render');

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
const FPS = 30;
const XF = 0.35; // transição (s)

function ffmpegBin() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try {
    return require('ffmpeg-static');
  } catch {
    return 'ffmpeg';
  }
}

const semMarca = (s = '') => String(s).replace(/\*/g, '');
// Tempo de leitura: ~22 caracteres por segundo, com piso e teto.
const leitura = (txt, min, max) => Math.min(max, Math.max(min, 1 + semMarca(txt).length / 22));

async function reel(jsonPath) {
  const post = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if ((post.versao_modelo || 0) < 4) throw new Error(`${jsonPath}: Reels só para posts v4.`);
  const dir = jsonPath.replace(/\.json$/, '');
  const cenasDir = path.join(dir, 'reel');
  fs.mkdirSync(cenasDir, { recursive: true });
  for (const f of post.fotos || []) {
    if (!f.arquivo) continue;
    const p = path.join(path.dirname(jsonPath), f.arquivo);
    if (!fs.existsSync(p)) continue;
    f.src = `data:${MIME[path.extname(p).slice(1).toLowerCase()] || 'image/jpeg'};base64,${fs.readFileSync(p).toString('base64')}`;
  }
  if (!(post.fotos || []).some((f) => f.src)) throw new Error(`${jsonPath}: sem foto baixada (rode foto.js).`);

  const htmls = reelSlides(post);
  const duracoes = [leitura(post.capa.manchete, 3, 4.5), ...post.slides.map((s) => leitura(s.texto, 3, 6)), 2.2];
  const cenas = [];
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    for (let i = 0; i < htmls.length; i++) {
      await page.setContent(htmls[i], { waitUntil: 'load', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const estourou = await page.evaluate(() => [...document.querySelectorAll('[data-box]')].some((n) => n.scrollHeight > n.clientHeight + 2));
      if (estourou) console.warn(`AVISO: cena ${i + 1} do Reels de ${jsonPath} com texto estourado. Encurte o texto.`);
      const file = path.join(cenasDir, `cena-${i + 1}.png`);
      await page.screenshot({ path: file, type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      cenas.push(file);
    }
  } finally {
    await browser.close();
  }

  // Cada cena: zoom lento (1.00 -> 1.05). Depois, xfade entre as cenas.
  const args = ['-y'];
  cenas.forEach((c, i) => args.push('-loop', '1', '-t', String(duracoes[i] + XF), '-i', c));
  args.push('-f', 'lavfi', '-t', '60', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100');
  const filtros = cenas.map((_, i) => {
    const n = Math.round((duracoes[i] + XF) * FPS);
    return `[${i}:v]scale=2160:3840,zoompan=z='1+0.05*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=1080x1920:fps=${FPS},setsar=1,format=yuv420p[v${i}]`;
  });
  let atual = 'v0';
  let t = duracoes[0];
  for (let i = 1; i < cenas.length; i++) {
    const out = i === cenas.length - 1 ? 'vout' : `x${i}`;
    filtros.push(`[${atual}][v${i}]xfade=transition=fade:duration=${XF}:offset=${t.toFixed(3)}[${out}]`);
    atual = out;
    t += duracoes[i];
  }
  if (cenas.length === 1) filtros.push('[v0]copy[vout]');
  const total = t + XF;
  const saida = path.join(dir, 'reel.mp4');
  args.push('-filter_complex', filtros.join(';'), '-map', '[vout]', '-map', `${cenas.length}:a`, '-t', total.toFixed(2));
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS));
  args.push('-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', saida);
  execFileSync(ffmpegBin(), args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const mb = fs.statSync(saida).size / 1048576;
  console.log(`${saida} (${total.toFixed(1)} s, ${mb.toFixed(1)} MB)`);
  return saida;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node reels.js <post.json> [...]');
    process.exit(1);
  }
  (async () => {
    for (const a of args) await reel(a);
  })().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}

module.exports = { reel };
