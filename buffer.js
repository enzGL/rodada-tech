// Agenda os posts da Rodada no Buffer (API oficial, plano Free: fila de 10 por canal).
// Sem dependências: Node 18+.
//
//   node buffer.js --checar                      confere chave, organização e canal do Instagram
//   node buffer.js --fila                        lista os posts agendados no Buffer
//   node buffer.js rodada/2026-11-27/*.json      agenda esses posts no horário do campo "horario" (São Paulo)
//   --teste                                      mostra o que seria agendado, sem chamar o Buffer
//
// Variáveis: BUFFER_TOKEN (obrigatória; Buffer > Settings > API), BUFFER_CHANNEL_ID (opcional: sem ela,
// usa o único canal Instagram da conta), RAW_BASE (padrão raw do GitHub enzGL/rodada-tech/main).
// As imagens precisam estar no GitHub (git push) antes: o Buffer baixa pela URL pública.
// Regras: post sem foto ou sem "Foto:" na legenda não é agendado; nunca agenda o mesmo post duas vezes (log/).
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
const TOKEN = process.env.BUFFER_TOKEN;
const RAW = (process.env.RAW_BASE || 'https://raw.githubusercontent.com/enzGL/rodada-tech/main').replace(/\/$/, '');
const FILA_MAX = 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}) {
  if (!TOKEN) {
    console.error('Falta BUFFER_TOKEN (Buffer > Settings > API).');
    process.exit(2);
  }
  for (let t = 0; t < 3; t++) {
    const r = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (r.status === 429) {
      await sleep(1000 * Number(r.headers.get('retry-after') || 30));
      continue;
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.errors) throw new Error(`Buffer ${r.status}: ${JSON.stringify(j.errors || j).slice(0, 500)}`);
    return j.data;
  }
  throw new Error('Buffer: limite de requisições (429) persistente.');
}

async function contexto() {
  const d = await gql('query { account { organizations { id name } } }');
  const orgs = d.account.organizations || [];
  for (const o of orgs) {
    const c = await gql('query($o: OrganizationId!) { channels(input: { organizationId: $o }) { id name displayName service isQueuePaused } }', { o: o.id }).catch(
      async () => gql(`query { channels(input: { organizationId: "${o.id}" }) { id name displayName service isQueuePaused } }`)
    );
    const ig = (c.channels || []).filter((x) => x.service === 'instagram');
    const canal = process.env.BUFFER_CHANNEL_ID ? (c.channels || []).find((x) => x.id === process.env.BUFFER_CHANNEL_ID) : ig.length === 1 ? ig[0] : null;
    if (canal) return { org: o, canal, canais: c.channels };
    if (ig.length > 1) throw new Error(`Mais de um Instagram no Buffer: defina BUFFER_CHANNEL_ID (${ig.map((x) => `${x.id}=${x.name}`).join(', ')})`);
  }
  throw new Error('Nenhum canal Instagram no Buffer.');
}

async function fila(ctx) {
  const d = await gql(
    `query { posts(input: { organizationId: "${ctx.org.id}", filter: { status: [scheduled], channelIds: ["${ctx.canal.id}"] }, sort: [{ field: dueAt, direction: asc }] }, first: 50) { edges { node { id text dueAt status } } } }`
  ).catch(() =>
    gql(`query { posts(input: { organizationId: "${ctx.org.id}", filter: { status: [scheduled] }, sort: [{ field: dueAt, direction: asc }] }) { edges { node { id text dueAt status channelId } } } }`)
  );
  return (d.posts.edges || []).map((e) => e.node).filter((n) => !n.channelId || n.channelId === ctx.canal.id);
}

// "2026-11-27" + "09:00" em São Paulo (UTC-3, sem horário de verão) -> ISO UTC
const dueAt = (data, hora) => new Date(`${data}T${hora}:00-03:00`).toISOString();

const logFile = (data) => path.join(ROOT, 'log', `${data.slice(0, 7)}.jsonl`);
function jaFeitos() {
  const dir = path.join(ROOT, 'log');
  if (!fs.existsSync(dir)) return new Set();
  const s = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl')))
    for (const l of fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean)) {
      const x = JSON.parse(l);
      if (['publicado', 'agendado_buffer'].includes(x.status)) s.add(x.post);
    }
  return s;
}
function registrar(data, entry) {
  fs.mkdirSync(path.join(ROOT, 'log'), { recursive: true });
  fs.appendFileSync(logFile(data), JSON.stringify({ quando: new Date().toISOString(), ...entry }) + '\n');
}

function preparar(jsonRel) {
  const rel = jsonRel.replace(/\\/g, '/').replace(/^\.\//, '');
  const post = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const dir = rel.replace(/\.json$/, '');
  const imgs = fs.existsSync(path.join(ROOT, dir))
    ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => /^\d+\.jpe?g$/i.test(f)).sort((a, b) => parseInt(a) - parseInt(b))
    : [];
  if (imgs.length < 2) throw new Error(`${rel}: precisa de 2+ slides JPEG (rode render.js).`);
  if (!(post.fotos || []).some((f) => f.arquivo && fs.existsSync(path.join(ROOT, path.dirname(rel), f.arquivo))))
    throw new Error(`${rel}: sem foto baixada. Post sem foto não é agendado.`);
  if (!post.legenda || post.legenda.length > 2200) throw new Error(`${rel}: legenda vazia ou acima de 2200 caracteres.`);
  if (!/\nFoto: /.test(post.legenda)) throw new Error(`${rel}: legenda sem a linha "Foto: <crédito>".`);
  if (!post.data || !/^\d\d:\d\d$/.test(post.horario || '')) throw new Error(`${rel}: faltam "data" e "horario" (HH:MM).`);
  const quando = dueAt(post.data, post.horario);
  if (new Date(quando) < new Date(Date.now() + 5 * 60000)) throw new Error(`${rel}: horário ${post.horario} de ${post.data} já passou.`);
  return { rel, post, urls: imgs.map((f) => `${RAW}/${dir}/${f}`), quando };
}

async function urlOk(u) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(u, { method: 'HEAD' }).catch(() => null);
    if (r && r.ok) return true;
    await sleep(5000);
  }
  return false;
}

async function agendar(arquivos, { teste = false } = {}) {
  const feitos = jaFeitos();
  const itens = [];
  for (const a of arquivos) {
    try {
      const it = preparar(a);
      if (feitos.has(it.rel)) console.log(`PULA ${it.rel}: já publicado/agendado.`);
      else itens.push(it);
    } catch (e) {
      console.error(`RECUSADO ${e.message}`);
    }
  }
  if (teste) {
    for (const it of itens) console.log(`TESTE ${it.rel} -> ${it.quando} (${it.urls.length} slides)`);
    return;
  }
  if (!itens.length) return;
  const ctx = await contexto();
  if (ctx.canal.isQueuePaused) throw new Error('A fila do Instagram está pausada no Buffer.');
  let ocupadas = (await fila(ctx)).length;
  for (const it of itens) {
    if (ocupadas >= FILA_MAX) {
      console.error(`FILA CHEIA (${FILA_MAX}): ${it.rel} fica para a próxima execução.`);
      continue;
    }
    for (const u of it.urls) if (!(await urlOk(u))) throw new Error(`Imagem não acessível: ${u} (fez git push?)`);
    const assets = it.urls.map((u) => `{ image: { url: ${JSON.stringify(u)} } }`).join(' ');
    const d = await gql(
      `mutation($t: String!) { createPost(input: { text: $t, channelId: "${ctx.canal.id}", schedulingType: automatic, mode: customScheduled, dueAt: "${it.quando}", assets: [${assets}], metadata: { instagram: { type: post, shouldShareToFeed: true } } }) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }`,
      { t: it.post.legenda }
    );
    const r = d.createPost;
    if (!r.post) {
      registrar(it.post.data, { status: 'erro_buffer', post: it.rel, erro: r.message });
      console.error(`ERRO ${it.rel}: ${r.message}`);
      continue;
    }
    ocupadas++;
    registrar(it.post.data, {
      status: 'agendado_buffer',
      post: it.rel,
      buffer_id: r.post.id,
      due_at: r.post.dueAt,
      manchete: String(it.post.capa?.manchete || '').replace(/\*/g, ''),
      fonte: it.post.fonte,
      fonte_url: it.post.fonte_url,
      checagem: it.post.checagem,
    });
    console.log(`AGENDADO ${it.rel} -> ${r.post.dueAt} (Buffer ${r.post.id})`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const teste = args.includes('--teste');
  const arqs = args.filter((a) => !a.startsWith('--'));
  (async () => {
    if (args.includes('--checar')) {
      const ctx = await contexto();
      const f = await fila(ctx);
      console.log(`Organização: ${ctx.org.name} (${ctx.org.id})`);
      console.log(`Canal: ${ctx.canal.service} ${ctx.canal.displayName || ctx.canal.name} (${ctx.canal.id})${ctx.canal.isQueuePaused ? ' PAUSADO' : ''}`);
      console.log(`Fila: ${f.length}/${FILA_MAX} agendados`);
    } else if (args.includes('--fila')) {
      const ctx = await contexto();
      for (const p of await fila(ctx)) console.log(`${p.dueAt}  ${p.id}  ${String(p.text).split('\n')[0].slice(0, 70)}`);
    } else if (args.includes('--remover')) {
      // node buffer.js --remover <buffer_id> [...]: tira da fila (não apaga post já publicado).
      for (const id of arqs) {
        const d = await gql(`mutation { deletePost(input: { id: "${id}" }) { __typename ... on MutationError { message } } }`);
        const r = d.deletePost || {};
        if (r.message) throw new Error(`Buffer ${id}: ${r.message}`);
        console.log(`REMOVIDO ${id} (${r.__typename})`);
      }
    } else if (arqs.length) {
      await agendar(arqs, { teste });
    } else {
      console.error('Uso: node buffer.js --checar | --fila | --remover <id> [...] | <post.json> [...] [--teste]');
      process.exit(1);
    }
  })().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { agendar };
