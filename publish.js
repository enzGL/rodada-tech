// Publica carrosséis da Rodada no Instagram (API oficial, login do Instagram).
// Sem dependências: Node 18+.
//
//   node publish.js --checar                 confere token, conta e limite de publicação
//   node publish.js rodada/2026-11-26/01.json   publica esse post
//   node publish.js --proximo                publica o próximo post de hoje cujo horário já chegou
//   --teste                                  cria os contêineres mas NÃO publica
//
// Variáveis: IG_TOKEN, IG_USER_ID (obrigatórias), IG_GRAPH_HOST (padrão graph.instagram.com),
// IG_API_VERSION (padrão v23.0), RAW_BASE (padrão raw do GitHub enzGL/rodada-tech/main).
// As imagens precisam estar no GitHub (git push) antes: o Instagram baixa pela URL pública.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
for (const f of ['.env.local', '.env']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p))
    for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const TOKEN = process.env.IG_TOKEN;
const USER = process.env.IG_USER_ID;
const HOST = process.env.IG_GRAPH_HOST || 'graph.instagram.com';
const VER = process.env.IG_API_VERSION || 'v23.0';
const RAW = (process.env.RAW_BASE || 'https://raw.githubusercontent.com/enzGL/rodada-tech/main').replace(/\/$/, '');
const API = `https://${HOST}/${VER}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function need() {
  if (!TOKEN || !USER) {
    console.error('Faltam IG_TOKEN e/ou IG_USER_ID nas variáveis de ambiente.');
    process.exit(2);
  }
}

async function call(method, endpoint, params = {}) {
  const url = new URL(`${API}/${endpoint}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  let res;
  if (method === 'GET') {
    for (const [k, v] of body) url.searchParams.set(k, v);
    res = await fetch(url);
  } else {
    res = await fetch(url, { method, body });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`${method} ${endpoint}: ${res.status} ${e.type || ''} ${e.code || ''} ${e.message || JSON.stringify(json)}`);
  }
  return json;
}

function hojeSP() {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` };
}

const logFile = (data) => path.join(ROOT, 'log', `${data.slice(0, 7)}.jsonl`);
function publicados(data) {
  const f = logFile(data);
  if (!fs.existsSync(f)) return new Set();
  return new Set(
    fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((x) => ['publicado', 'agendado_buffer'].includes(x.status)).map((x) => x.post)
  );
}
function registrar(data, entry) {
  fs.mkdirSync(path.join(ROOT, 'log'), { recursive: true });
  fs.appendFileSync(logFile(data), JSON.stringify({ quando: new Date().toISOString(), ...entry }) + '\n');
}

async function urlOk(u) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(u, { method: 'HEAD' }).catch(() => null);
    if (r && r.ok) return true;
    await sleep(5000);
  }
  return false;
}

async function esperarPronto(id) {
  for (let i = 0; i < 30; i++) {
    const s = await call('GET', id, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Contêiner ${id}: ${s.status_code} ${s.status || ''}`);
    await sleep(4000);
  }
  throw new Error(`Contêiner ${id} não ficou pronto a tempo.`);
}

async function publicar(jsonRel, { teste = false } = {}) {
  need();
  const rel = jsonRel.replace(/\\/g, '/').replace(/^\.\//, '');
  const post = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const dir = rel.replace(/\.json$/, '');
  const imgs = fs.readdirSync(path.join(ROOT, dir)).filter((f) => /^\d+\.jpe?g$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
  if (imgs.length < 2) throw new Error(`Carrossel precisa de 2+ imagens JPEG em ${dir} (rode render.js).`);
  if (!post.legenda) throw new Error('Post sem legenda.');
  // Regra do Enzo (2026-11-26): sem foto real, não publica.
  if (!(post.fotos || []).some((f) => f.arquivo && fs.existsSync(path.join(ROOT, path.dirname(rel), f.arquivo))))
    throw new Error('Post sem foto baixada (node foto.js). Post sem foto não é publicado.');
  if (!/\nFoto: /.test(post.legenda)) throw new Error('Legenda sem a linha "Foto: <crédito>".');
  if (post.legenda.length > 2200) throw new Error(`Legenda com ${post.legenda.length} caracteres (máx. 2200).`);
  if ((post.legenda.match(/#/g) || []).length > 30) throw new Error('Mais de 30 hashtags.');

  const urls = imgs.map((f) => `${RAW}/${dir}/${f}`);
  for (const u of urls) if (!(await urlOk(u))) throw new Error(`Imagem não acessível publicamente: ${u} (fez git push?)`);

  const filhos = [];
  for (const u of urls) {
    const r = await call('POST', `${USER}/media`, { image_url: u, is_carousel_item: 'true' });
    filhos.push(r.id);
  }
  for (const id of filhos) await esperarPronto(id);
  const car = await call('POST', `${USER}/media`, { media_type: 'CAROUSEL', children: filhos.join(','), caption: post.legenda });
  await esperarPronto(car.id);

  if (teste) {
    console.log(`TESTE OK: contêiner ${car.id} pronto, não publicado.`);
    return { teste: true, container: car.id };
  }
  const pub = await call('POST', `${USER}/media_publish`, { creation_id: car.id });
  let permalink = '';
  try {
    permalink = (await call('GET', pub.id, { fields: 'permalink' })).permalink || '';
  } catch {}
  registrar(post.data || hojeSP().data, {
    status: 'publicado',
    post: rel,
    media_id: pub.id,
    permalink,
    manchete: post.capa && post.capa.manchete,
    fonte: post.fonte,
    fonte_url: post.fonte_url,
    checagem: post.checagem,
  });
  console.log(`PUBLICADO: ${rel} -> ${permalink || pub.id}`);
  return { id: pub.id, permalink };
}

async function proximo(opts) {
  const { data, hora } = hojeSP();
  const dir = path.join(ROOT, 'rodada', data);
  if (!fs.existsSync(dir)) {
    console.log(`Sem rodada para ${data}.`);
    return;
  }
  const feitos = publicados(data);
  const fila = fs
    .readdirSync(dir)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort()
    .map((f) => ({ rel: `rodada/${data}/${f}`, post: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }))
    .filter((x) => !feitos.has(x.rel) && x.post.status !== 'descartado' && (x.post.horario || '00:00') <= hora);
  if (!fila.length) {
    console.log(`Nada pendente para publicar até ${hora} de ${data}.`);
    return;
  }
  const alvo = fila[0];
  try {
    await publicar(alvo.rel, opts);
  } catch (e) {
    registrar(data, { status: 'erro', post: alvo.rel, erro: String(e.message || e) });
    throw e;
  }
}

async function checar() {
  need();
  const conta = await call('GET', USER, { fields: 'username,name' });
  console.log('Conta:', JSON.stringify(conta), 'host:', HOST);
  const lim = await call('GET', `${USER}/content_publishing_limit`, { fields: 'config,quota_usage' });
  console.log('Limite:', JSON.stringify(lim.data || lim));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const teste = args.includes('--teste');
  const alvo = args.find((a) => !a.startsWith('--'));
  const run = args.includes('--checar') ? checar() : args.includes('--proximo') ? proximo({ teste }) : alvo ? publicar(alvo, { teste }) : null;
  if (!run) {
    console.error('Uso: node publish.js --checar | --proximo | <post.json> [--teste]');
    process.exit(1);
  }
  run.catch((e) => {
    console.error('ERRO:', e.message || e);
    process.exit(1);
  });
}

module.exports = { publicar, proximo, checar };
