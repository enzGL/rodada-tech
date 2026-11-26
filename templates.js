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
const H = 1350;
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

function slides(post) {
  const miolo = post.slides || [];
  if (!miolo.length) throw new Error('Post sem "slides" (formato v2).');
  const total = miolo.length + 1;
  return [capa(post), ...miolo.map((s, k) => (s.tipo === 'importa' ? importa : noticia)(post, s, k + 2, total))];
}

module.exports = { slides, capa, noticia, importa };
