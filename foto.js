// Baixa a foto de um post da Rodada para dentro do repositório.
// Uso: node foto.js rodada/2026-11-26/01.json
// Para cada item de post.fotos ({ url, pagina, credito }):
//   - url: link direto da imagem; ou
//   - pagina: página da notícia/anúncio, de onde se extrai a og:image (ou twitter:image); ou
//   - commons: "File:Nome.jpg" do Wikimedia Commons (licença livre; crédito preenchido sozinho).
// Arte genérica de changelog/blog (logo, texto em fundo liso) NÃO serve: tem que ser foto.
// Salva em rodada/AAAA-MM-DD/01/foto-1.jpg (e foto-2.jpg...) e grava o caminho em fotos[i].arquivo.
// Sem foto baixada, o post NÃO pode ser publicado (regra do Enzo, 2026-11-26).
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

async function ogImage(pagina) {
  const r = await fetch(pagina, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`página ${r.status}`);
  const html = await r.text();
  const metas = [...html.matchAll(/<meta\s+[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag, a) => (tag.match(new RegExp(`${a}\\s*=\\s*["']([^"']+)["']`, 'i')) || [])[1];
  for (const key of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) {
    const tag = metas.find((t) => (attr(t, 'property') || attr(t, 'name') || '').toLowerCase() === key);
    const c = tag && attr(tag, 'content');
    if (c) return new URL(c.replace(/&amp;/g, '&'), pagina).href;
  }
  throw new Error('página sem og:image');
}

async function commons(titulo) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', format: 'json', titles: titulo, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600' }).forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await (await fetch(u, { headers: { 'user-agent': UA_WIKI } })).json();
  const p = Object.values(j.query?.pages || {})[0];
  const i = p?.imageinfo?.[0];
  if (!i) throw new Error(`Commons sem arquivo ${titulo}`);
  const m = i.extmetadata || {};
  const autor = (m.Artist?.value || '').replace(/<[^>]+>/g, '').trim() || 'Autor desconhecido';
  return { url: i.thumburl || i.url, credito: `${autor}/Wikimedia Commons (${m.LicenseShortName?.value || 'licença livre'})` };
}

// Wikimedia pede User-Agent que identifique o projeto (política deles); site de notícia aceita o de navegador.
const UA_WIKI = 'RodadaTech/1.0 (https://github.com/enzGL/rodada-tech)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixar(url) {
  const ua = /wikimedia\.org/.test(url) ? UA_WIKI : UA;
  let r;
  for (let t = 0; t < 4; t++) {
    r = await fetch(url, { headers: { 'user-agent': ua, accept: 'image/*' }, redirect: 'follow' });
    if (r.status !== 429) break;
    await sleep(3000 * (t + 1));
  }
  if (!r.ok) throw new Error(`imagem ${r.status}`);
  const tipo = r.headers.get('content-type') || '';
  if (!/^image\//.test(tipo)) throw new Error(`não é imagem (${tipo})`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 15000) throw new Error(`imagem pequena demais (${buf.length} bytes)`);
  const ext = { 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' }[tipo.split(';')[0]] || 'jpg';
  return { buf, ext };
}


// Print real da página (a "prova"): { print: "<url>", seletor?: "<css do trecho>", altura?: 1100, credito: "Reprodução/<site>" }.
// Esconde banners de cookie comuns. Nunca montar print falso: só captura da página de verdade.
async function printPagina(f, destino) {
  const puppeteer = require("puppeteer-core");
  const { chromePath } = require("./render");
  const b = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const p = await b.newPage();
    await p.setUserAgent(UA);
    await p.setViewport({ width: f.largura || 1000, height: f.altura || 1100, deviceScaleFactor: 2 });
    await p.goto(f.print, { waitUntil: "networkidle2", timeout: 60000 });
    await p.addStyleTag({ content: "[id*=cookie i],[class*=cookie i],[id*=consent i],[class*=consent i],[class*=onetrust i],#onetrust-banner-sdk,[aria-modal=true]{display:none!important}" });
    await new Promise((r) => setTimeout(r, 1500));
    if (f.seletor) {
      const el = await p.$(f.seletor);
      if (!el) throw new Error("seletor não encontrado: " + f.seletor);
      await el.screenshot({ path: destino, type: "jpeg", quality: 90 });
    } else {
      await p.screenshot({ path: destino, type: "jpeg", quality: 90 });
    }
  } finally { await b.close(); }
}

async function fotos(jsonPath) {
  const post = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const dir = jsonPath.replace(/\.json$/, '');
  fs.mkdirSync(dir, { recursive: true });
  const lista = post.fotos || [];
  if (!lista.length) throw new Error(`${jsonPath}: sem "fotos". Post sem foto não é publicado.`);
  let ok = 0;
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i];
    try {
      if (f.print) {
        for (const velho of fs.readdirSync(dir).filter((x) => x.startsWith(`foto-${i + 1}.`))) fs.unlinkSync(path.join(dir, velho));
        const destino = path.join(dir, `foto-${i + 1}.jpg`);
        await printPagina(f, destino);
        f.arquivo = path.relative(path.dirname(jsonPath), destino).replace(/\\/g, '/');
        ok++;
        console.log(`OK print ${i + 1}: ${f.print}`);
        continue;
      }
      let url = f.url;
      if (!url && f.commons) {
        const c = await commons(f.commons);
        url = c.url;
        f.credito = f.credito || c.credito;
      }
      if (!url) url = await ogImage(f.pagina);
      f.url = url;
      const { buf, ext } = await baixar(url);
      for (const velho of fs.readdirSync(dir).filter((x) => x.startsWith(`foto-${i + 1}.`))) fs.unlinkSync(path.join(dir, velho));
      const destino = path.join(dir, `foto-${i + 1}.${ext}`);
      fs.writeFileSync(destino, buf);
      const n = buf.length;
      f.url = url;
      f.arquivo = path.relative(path.dirname(jsonPath), destino).replace(/\\/g, '/');
      ok++;
      console.log(`OK foto ${i + 1}: ${url} (${Math.round(n / 1024)} KB)`);
    } catch (e) {
      console.warn(`FALHOU foto ${i + 1} (${f.url || f.pagina}): ${e.message}`);
      delete f.arquivo;
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(post, null, 2) + '\n');
  if (!ok) throw new Error(`${jsonPath}: nenhuma foto baixada. Troque a foto ou descarte o post.`);
  return ok;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Uso: node foto.js <post.json> [...]');
    process.exit(1);
  }
  (async () => {
    let falhou = false;
    for (const a of args) await fotos(a).catch((e) => ((falhou = true), console.error(e.message)));
    if (falhou) process.exit(3);
  })();
}

module.exports = { fotos, ogImage, commons };
