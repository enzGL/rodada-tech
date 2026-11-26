// Modelos dos slides da Rodada Tech, v2 (2026-11-26).
// Pedido do Enzo: cara de veículo de notícia, com FOTO em todo post (capa e miolo).
// Fora: capa só tipográfica, tabela "número | texto", passos 01/02/03, caixa "roda de conversa", "5 notícias por dia".
// Cores: Sinal #FF5A1F, Tinta #0E0E0C, Papel #F3F1EA, Cinza #8A877E. Laranja sobre claro: #C2410C.
//
// Formato do post:
//   fotos: [{ arquivo, credito }]                       (foto.js preenche "arquivo")
//   capa: { manchete, foto: 1, posicao: "center 30%" }  (*palavra* = destaque laranja)
//   slides: [
//     { tipo: "noticia", texto, dado: { numero, rotulo }, foto: 1|2, posicao },
//     { tipo: "importa", texto, pergunta, foto: 1|2 }
//   ]
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const up = (s = '') => esc(String(s).toUpperCase());
// *trecho* vira destaque. "cls" é o estilo do destaque.
const marca = (s, estilo) => esc(s).replace(/\*([^*]+)\*/g, `<span style="${estilo}">$1</span>`);
const semMarca = (s = '') => String(s).replace(/\*/g, '');

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function dataCurta(post) {
  const [a, m, d] = (post.data || '').split('-');
  return m ? `${Number(d)} ${MESES[Number(m) - 1]} ${a}` : '';
}

const head = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap">
<style>html,body{margin:0;padding:0}*{box-sizing:border-box}img{display:block}</style></head><body>`;
const foot = `</body></html>`;
const MONO = "font-family:'JetBrains Mono',monospace";
const ARCH = 'font-family:Archivo,sans-serif';
const W = 1080;
let PB = 0; // folga embaixo (Reels: área da legenda do Instagram)
let PT = 0; // folga em cima (Reels)
let H = 1350; // 1440 (3:4) desde o modelo v4; 1350 (4:5) nos antigos
const dims = (post) => ({ w: 1080, h: post && post.formato === "3:4" ? 1440 : 1350 });
const M = 72; // margem

const anel = (ponto, size = 44) => `<svg viewBox="0 0 100 100" style="width:${size}px;height:${size}px;flex:none" aria-hidden="true">
<circle cx="50" cy="50" r="38" fill="none" stroke="#FF5A1F" stroke-width="20" stroke-dasharray="196 43" transform="rotate(-90 50 50)"></circle>
<circle cx="29.3" cy="18.1" r="10" fill="${ponto}"></circle></svg>`;
const logo = (cor, ponto) =>
  `<div style="display:flex;align-items:center;gap:10px">${anel(ponto)}<span style="${ARCH};font-weight:900;font-size:34px;letter-spacing:-.04em;color:${cor}">rodada</span></div>`;

function fit(text, sizes) {
  const n = semMarca(text).length;
  for (const [max, px] of sizes) if (n <= max) return px;
  return sizes[sizes.length - 1][1];
}

function foto(post, n = 1) {
  const f = (post.fotos || [])[n - 1] || (post.fotos || []).find((x) => x.src);
  if (!f || !f.src) throw new Error(`Post sem foto ${n} carregada (rode foto.js). Post sem foto não é publicado.`);
  return f;
}
const kicker = (txt, fundo, cor) =>
  `<span style="align-self:flex-start;background:${fundo};color:${cor};${MONO};font-weight:700;font-size:22px;letter-spacing:.14em;padding:9px 14px 8px">${up(txt)}</span>`;

// Slide 1: foto em tela cheia, manchete de jornal embaixo.
function capa(post) {
  const c = post.capa;
  const f = foto(post, c.foto || 1);
  const h = fit(c.manchete, [[40, 118], [55, 104], [70, 92], [90, 82], [999, 72]]);
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif">
<img src="${f.src}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${esc(c.posicao || 'center')}">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,14,12,.55) 0%,rgba(14,14,12,0) 16%,rgba(14,14,12,0) 34%,rgba(14,14,12,.78) 56%,rgba(14,14,12,.97) 74%,#0E0E0C 100%)"></div>
<div style="position:absolute;left:${M}px;right:${M}px;top:${M - 8}px;display:flex;justify-content:space-between;align-items:center">
${logo('#F3F1EA', '#F3F1EA')}<span style="${MONO};font-weight:500;font-size:20px;letter-spacing:.12em;color:#F3F1EA">${esc(dataCurta(post))}</span></div>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M}px;display:flex;flex-direction:column;gap:26px" data-capa>
${kicker(post.editoria, '#FF5A1F', '#0E0E0C')}
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.94;letter-spacing:-.005em;text-transform:uppercase">${marca(c.manchete, 'color:#FF5A1F')}</h1>
<div style="display:flex;justify-content:space-between;align-items:center;gap:24px;border-top:2px solid rgba(243,241,234,.22);padding-top:22px;${MONO};font-size:17px;letter-spacing:.08em;color:#A8A59B">
<span>FOTO: ${up(f.credito || 'Divulgação')}</span><span style="flex:none;color:#F3F1EA;font-weight:700">ARRASTA →</span></div></div></div>${foot}`;
}

// Slide da notícia: foto em cima, texto de matéria embaixo, dado sobre a foto.
function noticia(post, s, i, total) {
  const f = foto(post, s.foto || 2);
  const FH = 640;
  const tam = fit(s.texto, [[180, 46], [240, 42], [300, 39], [999, 35]]);
  const dado = s.dado
    ? `<div style="position:absolute;left:${M}px;top:${FH - 96}px;background:#0E0E0C;padding:26px 32px 24px;display:flex;flex-direction:column;gap:6px;max-width:${W - 2 * M}px">
<span style="${ARCH};font-weight:900;font-stretch:80%;font-size:${fit(s.dado.numero, [[6, 96], [10, 80], [999, 64]])}px;line-height:.9;color:#FF5A1F">${esc(s.dado.numero)}</span>
<span style="${MONO};font-weight:500;font-size:19px;letter-spacing:.08em;color:#F3F1EA">${up(s.dado.rotulo)}</span></div>`
    : '';
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#F3F1EA;color:#0E0E0C;font-family:Inter,sans-serif">
<img src="${f.src}" style="position:absolute;left:0;top:0;width:${W}px;height:${FH}px;object-fit:cover;object-position:${esc(s.posicao || 'center')}">
<span style="position:absolute;right:20px;top:20px;background:rgba(14,14,12,.62);color:#E7E4DA;${MONO};font-size:14px;letter-spacing:.06em;padding:6px 10px">FOTO: ${up(f.credito || 'Divulgação')}</span>
${dado}
<div style="position:absolute;left:${M}px;right:${M}px;top:${FH + (s.dado ? 128 : 64)}px;bottom:${M + 56}px;display:flex;flex-direction:column;gap:24px" data-box>
<span style="${MONO};font-weight:700;font-size:20px;letter-spacing:.16em;color:#C2410C">${up(s.kicker || 'A notícia')}</span>
<p style="margin:0;font-size:${tam}px;line-height:1.42;letter-spacing:-.005em">${marca(s.texto, 'font-weight:700;background:linear-gradient(180deg,transparent 58%,rgba(255,90,31,.38) 58%)')}</p></div>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M - 8}px;display:flex;justify-content:space-between;${MONO};font-size:17px;letter-spacing:.08em;color:#5C5A52">
<span>FONTE: ${up(post.fonte)}</span><span>${i}/${total}</span></div></div>${foot}`;
}

// Slide final: por que importa + pergunta. Faixa de foto em cima, escurecida.
function importa(post, s, i, total) {
  const f = foto(post, s.foto || 1);
  const FH = 540;
  const tam = fit(s.texto, [[160, 46], [220, 42], [280, 38], [999, 34]]);
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif">
<img src="${f.src}" style="position:absolute;left:0;top:0;width:${W}px;height:${FH}px;object-fit:cover;object-position:${esc(s.posicao || 'center')};filter:grayscale(1) contrast(1.1)">
<div style="position:absolute;left:0;top:0;width:${W}px;height:${FH}px;background:linear-gradient(180deg,rgba(14,14,12,.2) 0%,rgba(14,14,12,.45) 55%,#0E0E0C 100%)"></div>
<div style="position:absolute;left:${M}px;right:${M}px;top:${FH - 40}px;bottom:${M + 56}px;display:flex;flex-direction:column;gap:30px" data-box>
${kicker(s.kicker || 'Por que importa', '#FF5A1F', '#0E0E0C')}
<p style="margin:0;font-size:${tam}px;line-height:1.4">${marca(s.texto, 'color:#FF5A1F;font-weight:700')}</p>
${s.pergunta ? `<div style="margin-top:auto;border-top:3px solid #FF5A1F;padding-top:30px;display:flex;flex-direction:column;gap:14px">
<span style="${MONO};font-weight:700;font-size:19px;letter-spacing:.16em;color:#8A877E">E VOCÊ?</span>
<span style="${ARCH};font-weight:800;font-size:${fit(s.pergunta, [[60, 50], [90, 44], [999, 38]])}px;line-height:1.08;letter-spacing:-.01em">${esc(s.pergunta)}</span></div>` : ''}</div>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M - 8}px;display:flex;justify-content:space-between;${MONO};font-size:17px;letter-spacing:.08em;color:#8A877E">
<span>FONTE: ${up(post.fonte)}</span><span style="color:#F3F1EA;font-weight:700">SEGUE @RODADA.TECH</span></div></div>${foot}`;
}

// ---------------------------------------------------------------------------
// Modelos de teste A a E (2026-11-26), a partir das páginas que viralizam
// (ver vault: conteudo/inspiracoes/empresa/rodada-tech/2026-11-26-virais/README.md).
//   capa.modelo: "foto" (padrão; A e E, aceita capa.selo), "citacao" (B), "duelo" (C), "pergunta" (D)
//   slides extras: { tipo: "prova" } (trecho real da fonte) e { tipo: "barras" } (gráfico simples)
// ---------------------------------------------------------------------------

// Selo redondo sobre a foto (o "assunto" da notícia: número, tema ou "?").
function selo(txt, grande = false) {
  const d = grande ? 230 : 200;
  const n = semMarca(txt).length;
  const fs = grande ? 170 : n <= 3 ? 74 : n <= 6 ? 52 : n <= 9 ? 40 : 32;
  return `<div style="position:absolute;right:${M}px;top:150px;width:${d}px;height:${d}px;border-radius:50%;background:#0E0E0C;border:10px solid #FF5A1F;display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;transform:rotate(-8deg);box-shadow:0 18px 40px rgba(0,0,0,.35)">
<span style="${ARCH};font-weight:900;font-stretch:75%;font-size:${fs}px;line-height:.92;color:#F3F1EA;text-transform:uppercase">${marca(txt, 'color:#FF5A1F')}</span></div>`;
}

const topo = (post) => `<div style="position:absolute;left:${M}px;right:${M}px;top:${M - 8}px;display:flex;justify-content:space-between;align-items:center">
${logo('#F3F1EA', '#F3F1EA')}<span style="${MONO};font-weight:500;font-size:20px;letter-spacing:.12em;color:#F3F1EA">${esc(dataCurta(post))}</span></div>`;

const rodapeCapa = (credito, acao = 'ARRASTA →') => `<div style="display:flex;justify-content:space-between;align-items:center;gap:24px;border-top:2px solid rgba(243,241,234,.22);padding-top:22px;${MONO};font-size:17px;letter-spacing:.08em;color:#A8A59B">
<span>${credito}</span><span style="flex:none;color:#F3F1EA;font-weight:700">${acao}</span></div>`;

const fundoFoto = (f, posicao) => `<img src="${f.src}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${esc(posicao || 'center')}">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,14,12,.55) 0%,rgba(14,14,12,0) 16%,rgba(14,14,12,0) 32%,rgba(14,14,12,.8) 54%,rgba(14,14,12,.97) 72%,#0E0E0C 100%)"></div>`;

// A, E (selo) e D (pergunta): foto em tela cheia + manchete.
function capaFoto(post) {
  const c = post.capa;
  if (!c.selo && c.modelo !== 'pergunta') return capa(post);
  const f = foto(post, c.foto || 1);
  const h = fit(c.manchete, [[40, 118], [55, 104], [70, 92], [90, 82], [999, 72]]);
  const pergunta = c.modelo === 'pergunta';
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif">
${fundoFoto(f, c.posicao)}${topo(post)}${selo(pergunta ? '?' : c.selo, pergunta)}
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M}px;display:flex;flex-direction:column;gap:26px" data-capa>
${kicker(post.editoria, '#FF5A1F', '#0E0E0C')}
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.94;letter-spacing:-.005em;text-transform:uppercase">${marca(c.manchete, 'color:#FF5A1F')}</h1>
${rodapeCapa(`FOTO: ${up(f.credito || 'Divulgação')}`, pergunta ? 'ARRASTA PRA VER A RESPOSTA →' : 'ARRASTA →')}</div></div>${foot}`;
}

// B: a citação é a manchete. capa.manchete = frase (sem aspas), capa.autor = "Nome, cargo".
function capaCitacao(post) {
  const c = post.capa;
  const f = foto(post, c.foto || 1);
  const h = fit(c.manchete, [[40, 112], [55, 98], [70, 88], [90, 78], [999, 68]]);
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif">
${fundoFoto(f, c.posicao)}${topo(post)}
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M}px;display:flex;flex-direction:column;gap:22px" data-capa>
${kicker(post.editoria, '#FF5A1F', '#0E0E0C')}
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.94;letter-spacing:-.005em;text-transform:uppercase"><span style="color:#FF5A1F">“</span>${marca(c.manchete, 'color:#FF5A1F')}<span style="color:#FF5A1F">”</span></h1>
<span style="${MONO};font-weight:700;font-size:22px;letter-spacing:.1em;color:#FF5A1F">${up(c.autor || '')}</span>
${rodapeCapa(`FOTO: ${up(f.credito || 'Divulgação')}`)}</div></div>${foot}`;
}

// C: dois lados, dois números. capa.lados = [{ foto, posicao, nome, numero }, {...}], capa.rotulo.
function capaDuelo(post) {
  const c = post.capa;
  const lados = (c.lados || []).slice(0, 2);
  if (lados.length < 2) throw new Error('capa.modelo "duelo" precisa de 2 itens em capa.lados.');
  const fs = lados.map((l) => foto(post, l.foto));
  const h = fit(c.manchete, [[40, 84], [60, 74], [80, 66], [999, 58]]);
  const lado = (l, f, cor) => `<div style="display:flex;flex-direction:column;align-items:center;gap:22px;width:440px">
<div style="width:400px;height:400px;border-radius:50%;overflow:hidden;border:10px solid ${cor};background:#222">
<img src="${f.src}" style="width:100%;height:100%;object-fit:cover;object-position:${esc(l.posicao || 'center')}"></div>
<span style="background:${cor};color:#0E0E0C;${MONO};font-weight:700;font-size:26px;letter-spacing:.12em;padding:10px 18px 9px">${up(l.nome)}</span>
<span style="${ARCH};font-weight:900;font-stretch:75%;font-size:${fit(l.numero, [[5, 150], [7, 124], [9, 104], [999, 88]])}px;line-height:.9;color:#F3F1EA">${esc(l.numero)}</span></div>`;
  const creditos = [...new Set(fs.map((f) => f.credito || 'Divulgação'))].join(' · ');
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:radial-gradient(120% 80% at 50% 38%,#24221E 0%,#0E0E0C 70%);color:#F3F1EA;font-family:Inter,sans-serif">
${topo(post)}
<div style="position:absolute;left:${M}px;right:${M}px;top:168px;display:flex;flex-direction:column;gap:20px">
${kicker(post.editoria, '#FF5A1F', '#0E0E0C')}
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.95;text-transform:uppercase">${marca(c.manchete, 'color:#FF5A1F')}</h1></div>
<div style="position:absolute;left:${M - 20}px;right:${M - 20}px;top:460px;display:flex;justify-content:space-between">
${lado(lados[0], fs[0], lados[0].cor || '#FF5A1F')}${lado(lados[1], fs[1], lados[1].cor || '#8A877E')}</div>
<span style="position:absolute;left:50%;top:605px;transform:translateX(-50%);${ARCH};font-weight:900;font-size:54px;color:#0E0E0C;background:#F3F1EA;border-radius:50%;width:110px;height:110px;display:flex;align-items:center;justify-content:center">X</span>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M}px;display:flex;flex-direction:column;gap:22px">
<span style="text-align:center;${MONO};font-weight:700;font-size:22px;letter-spacing:.14em;color:#A8A59B">${up(c.rotulo || '')}</span>
${rodapeCapa(`FOTOS: ${up(creditos)}`)}</div></div>${foot}`;
}

// A prova: trecho real da fonte (original em inglês + tradução). Nunca inventar print.
// { tipo: "prova", origem, endereco, data, titulo, original, traducao, kicker }
function prova(post, s, i, total) {
  const tam = fit(s.traducao || '', [[140, 40], [200, 37], [260, 34], [999, 31]]);
  const f = s.foto === 0 ? null : foto(post, s.foto || 1);
  const FH = 380; // faixa de foto embaixo
  const faixa = f
    ? `<img src="${f.src}" style="position:absolute;left:0;bottom:0;width:${W}px;height:${FH}px;object-fit:cover;object-position:${esc(s.posicao || 'center 30%')}">
<div style="position:absolute;left:0;bottom:0;width:${W}px;height:${FH}px;background:linear-gradient(180deg,#F3F1EA 0%,rgba(243,241,234,0) 28%,rgba(14,14,12,0) 60%,rgba(14,14,12,.85) 100%)"></div>
<span style="position:absolute;right:${M}px;bottom:${M + 40}px;color:#E7E4DA;${MONO};font-size:14px;letter-spacing:.06em">FOTO: ${up(f.credito || 'Divulgação')}</span>`
    : '';
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#F3F1EA;color:#0E0E0C;font-family:Inter,sans-serif">
${faixa}
<div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;bottom:${f ? FH - 20 : M + 56}px;display:flex;flex-direction:column;gap:30px" data-box>
<span style="${MONO};font-weight:700;font-size:20px;letter-spacing:.16em;color:#C2410C">${up(s.kicker || 'A prova')}</span>
<div style="background:#FFFFFF;border:3px solid #0E0E0C;box-shadow:14px 14px 0 #FF5A1F;padding:40px 44px;display:flex;flex-direction:column;gap:22px">
<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;border-bottom:2px solid #E4E1D8;padding-bottom:18px">
<span style="font-weight:700;font-size:28px">${esc(s.origem || post.fonte)}</span>
<span style="${MONO};font-size:18px;letter-spacing:.06em;color:#5C5A52">${esc(s.endereco || '')}${s.data ? ' · ' + up(s.data) : ''}</span></div>
${s.titulo ? `<span style="${ARCH};font-weight:800;font-size:38px;line-height:1.1">${esc(s.titulo)}</span>` : ''}
<p style="margin:0;font-size:31px;line-height:1.4;color:#33322D;font-style:italic">${marca(s.original, 'font-style:normal;font-weight:700;color:#0E0E0C;background:linear-gradient(180deg,transparent 58%,rgba(255,90,31,.38) 58%)')}</p></div>
${s.traducao ? `<div style="display:flex;flex-direction:column;gap:14px"><span style="${MONO};font-weight:700;font-size:18px;letter-spacing:.14em;color:#8A877E">EM PORTUGUÊS</span>
<p style="margin:0;font-size:${tam}px;line-height:1.38">${marca(s.traducao, 'font-weight:700;color:#C2410C')}</p></div>` : ''}</div>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M - 8}px;display:flex;justify-content:space-between;${MONO};font-size:17px;letter-spacing:.08em;color:${f ? '#E7E4DA' : '#5C5A52'}">
<span>FONTE: ${up(s.origem || post.fonte)}</span><span>${i}/${total}</span></div></div>${foot}`;
}

// Gráfico de barras horizontal. { tipo: "barras", titulo, itens: [{ nome, valor, texto, destaque }], nota }
function barras(post, s, i, total) {
  const itens = s.itens || [];
  const max = Math.max(...itens.map((x) => Math.abs(x.valor)));
  const linha = (x) => `<div style="display:flex;flex-direction:column;gap:12px">
<div style="display:flex;justify-content:space-between;align-items:baseline">
<span style="${MONO};font-weight:700;font-size:24px;letter-spacing:.1em">${up(x.nome)}</span>
<span style="${ARCH};font-weight:900;font-stretch:80%;font-size:${itens.length > 3 ? 64 : 80}px;line-height:1;color:${x.destaque ? '#C2410C' : '#0E0E0C'}">${esc(x.texto)}</span></div>
<div style="height:${itens.length > 3 ? 64 : 88}px;background:#E4E1D8"><div style="height:100%;width:${Math.max(4, (Math.abs(x.valor) / max) * 100).toFixed(1)}%;background:${x.destaque ? '#FF5A1F' : '#0E0E0C'}"></div></div></div>`;
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#F3F1EA;color:#0E0E0C;font-family:Inter,sans-serif">
<div style="position:absolute;left:${M}px;right:${M}px;top:${M}px;bottom:${M + 56}px;display:flex;flex-direction:column;gap:40px" data-box>
<span style="${MONO};font-weight:700;font-size:20px;letter-spacing:.16em;color:#C2410C">${up(s.kicker || 'Os números')}</span>
<h2 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${fit(s.titulo, [[40, 88], [60, 76], [999, 66]])}px;line-height:.95;text-transform:uppercase">${marca(s.titulo, 'color:#C2410C')}</h2>
<div style="display:flex;flex-direction:column;gap:${itens.length > 3 ? 44 : 60}px;margin:auto 0">${itens.map(linha).join('')}</div>
${s.nota ? `<p style="margin:0;border-top:3px solid #0E0E0C;padding-top:28px;font-size:34px;line-height:1.38;color:#33322D">${marca(s.nota, 'font-weight:700;color:#C2410C')}</p>` : ''}</div>
<div style="position:absolute;left:${M}px;right:${M}px;bottom:${M - 8}px;display:flex;justify-content:space-between;${MONO};font-size:17px;letter-spacing:.08em;color:#5C5A52">
<span>FONTE: ${up(s.fonte || post.fonte)}</span><span>${i}/${total}</span></div></div>${foot}`;
}

// ---------------------------------------------------------------------------
// Modelo v4 (2026-11-26), a partir do @notstartups.ai (estratégia aprovada pelo Enzo):
// 3:4 (1080x1440), protagonista em foto + círculo (logo/2ª pessoa), editoria espaçada,
// manchete factual em caixa alta; miolo = imagem real (prova) + 1 a 2 frases curtas;
// último slide = assinatura "Siga e compartilhe". Crédito da foto pequeno no pé.
// Post: { versao_modelo: 4, formato: "3:4", editoria, capa: { manchete, foto, posicao, circulo: { foto, posicao } },
//         slides: [{ foto, posicao, encaixe: "moldura"|"cheia", texto }] }
// ---------------------------------------------------------------------------
const logoV4 = (tam = 40) => `<div style="display:flex;align-items:center;gap:12px">${anel('#F3F1EA', tam)}<span style="${ARCH};font-weight:900;font-size:${Math.round(tam * 0.82)}px;letter-spacing:-.04em;color:#F3F1EA">rodada</span></div>`;
const editoriaV4 = (txt) => `<span style="${ARCH};font-weight:700;font-size:26px;letter-spacing:.28em;color:#F3F1EA">${up(txt)}</span>`;
const creditoV4 = (f) => `<span style="position:absolute;right:${M}px;bottom:${28 + PB}px;${MONO};font-size:14px;letter-spacing:.06em;color:rgba(243,241,234,.55)">FOTO: ${up(f.credito || 'Divulgação')}</span>`;
const manV4 = (s, px, tag = 'h1') => `<${tag} style="margin:0;${ARCH};font-weight:800;font-size:${px}px;line-height:1.04;letter-spacing:-.01em;text-transform:uppercase;color:#F3F1EA">${marca(s, 'color:#FF5A1F')}</${tag}>`;

function capaV4(post) {
  const c = post.capa;
  const f = foto(post, c.foto || 1);
  const px = fit(c.manchete, [[60, 72], [90, 64], [120, 58], [999, 52]]);
  const ci = c.circulo ? foto(post, c.circulo.foto) : null;
  const cred = ci ? { credito: [...new Set([f.credito, ci.credito].filter(Boolean))].join(' · ') } : f;
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;font-family:Inter,sans-serif">
<img src="${f.src}" style="position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;object-position:${esc(c.posicao || 'center')}">
<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,14,12,.45) 0%,rgba(14,14,12,0) 14%,rgba(14,14,12,0) 50%,rgba(14,14,12,.85) 68%,#0E0E0C 82%)"></div>
<div style="position:absolute;left:${M + 36}px;top:${96 + PT}px">${logoV4()}</div>
${ci ? `<div style="position:absolute;left:${M}px;top:290px;width:360px;height:360px;border-radius:50%;overflow:hidden;border:6px solid #F3F1EA;box-shadow:0 20px 50px rgba(0,0,0,.35);background:#F3F1EA">
<img src="${ci.src}" style="width:100%;height:100%;object-fit:${c.circulo.encaixe === 'conter' ? 'contain' : 'cover'};object-position:${esc(c.circulo.posicao || 'center')}"></div>` : ''}
<div style="position:absolute;left:${M + 36}px;right:${M + 36}px;bottom:${118 + PB}px;display:flex;flex-direction:column;gap:30px" data-capa>
${editoriaV4(post.editoria)}${manV4(c.manchete, px)}</div>
${creditoV4(cred)}</div>${foot}`;
}

function slideV4(post, s) {
  const f = foto(post, s.foto || 1);
  const cheia = s.encaixe === 'cheia';
  const px = fit(s.texto, [[80, 52], [140, 46], [200, 42], [999, 38]]);
  const blocos = String(s.texto).split(/\n\s*\n/).map((b) => manV4(b, px, 'p')).join('');
  const AREA = H - 540 - PB; // altura reservada para a imagem
  const img = cheia
    ? `<img src="${f.src}" style="position:absolute;left:0;top:0;width:${W}px;height:${AREA + 60}px;object-fit:cover;object-position:${esc(s.posicao || 'center')}">
<div style="position:absolute;left:0;top:0;width:${W}px;height:${AREA + 60}px;background:linear-gradient(180deg,rgba(14,14,12,.55) 0%,rgba(14,14,12,0) 18%,rgba(14,14,12,0) 70%,#0E0E0C 100%)"></div>`
    : `<div style="position:absolute;left:${M + 60}px;right:${M + 60}px;top:${220 + PT}px;height:${AREA - 250 - PT}px;display:flex;align-items:center;justify-content:center">
<img src="${f.src}" style="max-width:100%;max-height:100%;object-fit:contain;border:4px solid #F3F1EA;box-shadow:0 24px 60px rgba(0,0,0,.5)"></div>`;
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;font-family:Inter,sans-serif">
${img}<div style="position:absolute;left:${M + 36}px;top:${96 + PT}px">${logoV4()}</div>
<div style="position:absolute;left:${M + 36}px;right:${M + 36}px;top:${AREA + 20}px;bottom:${84 + PB}px;display:flex;flex-direction:column;gap:24px" data-box>
${editoriaV4(post.editoria)}${blocos}</div>${creditoV4(f)}</div>${foot}`;
}

function assinaturaV4() {
  return `${head}<div data-slide style="width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;text-align:center;padding:0 ${M + 20}px">
${logoV4(120)}
<p style="margin:0;${ARCH};font-weight:800;font-size:56px;line-height:1.12;letter-spacing:-.01em">A rodada diária de IA, startups e tecnologia para devs e founders.</p>
<p style="margin:0;${ARCH};font-weight:800;font-size:44px;color:#FF5A1F">Siga e compartilhe ↗</p></div>${foot}`;
}

const CAPAS = { foto: capaFoto, pergunta: capaFoto, citacao: capaCitacao, duelo: capaDuelo };
const MIOLO = { noticia, importa, prova, barras };

function slides(post) {
  H = dims(post).h;
  if ((post.versao_modelo || 0) >= 4) {
    if (!(post.slides || []).length) throw new Error('Post v4 sem "slides".');
    return [capaV4(post), ...post.slides.map((s) => slideV4(post, s)), assinaturaV4()];
  }
  const miolo = post.slides || [];
  if (!miolo.length) throw new Error('Post sem "slides" (formato v2).');
  const total = miolo.length + 1;
  const fazCapa = CAPAS[(post.capa && post.capa.modelo) || 'foto'] || capaFoto;
  return [fazCapa(post), ...miolo.map((s, k) => (MIOLO[s.tipo] || noticia)(post, s, k + 2, total))];
}

// Reels (9:16): mesmas peças do v4, com folga para a interface do Instagram.
function reelSlides(post) {
  const salvo = [H, PB, PT];
  H = 1920; PB = 320; PT = 150;
  try {
    return [capaV4(post), ...post.slides.map((s) => slideV4(post, s)), assinaturaV4()];
  } finally {
    [H, PB, PT] = salvo;
  }
}

module.exports = { reelSlides, dims, slides, capa, noticia, importa, prova, barras, capaCitacao, capaDuelo };
