// Modelos dos 3 slides da Rodada Tech (aprovados pelo Enzo em 2026-11-25).
// Cores: Sinal #FF5A1F, Tinta #0E0E0C, Papel #F3F1EA, Cinza #8A877E.
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const up = (s = '') => esc(String(s).toUpperCase());

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function selo(post) {
  const [, m, d] = (post.data || '').split('-');
  const num = post.edicao ? `#${String(post.edicao).padStart(3, '0')} · ` : '';
  return m ? `${num}${Number(d)} ${MESES[Number(m) - 1]}` : num;
}

const head = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap">
<style>html,body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>`;
const foot = `</body></html>`;
const MONO = "font-family:'JetBrains Mono',monospace";
const ARCH = 'font-family:Archivo,sans-serif';

const anel = (ponto, size = 48) => `<svg viewBox="0 0 100 100" style="width:${size}px;height:${size}px" aria-hidden="true">
<circle cx="50" cy="50" r="38" fill="none" stroke="#FF5A1F" stroke-width="20" stroke-dasharray="196 43" transform="rotate(-90 50 50)"></circle>
<circle cx="29.3" cy="18.1" r="10" fill="${ponto}"></circle></svg>`;

// Tamanho da manchete conforme o comprimento, para não estourar o slide.
function fit(text, sizes) {
  const n = String(text || '').length;
  for (const [max, px] of sizes) if (n <= max) return px;
  return sizes[sizes.length - 1][1];
}

function capaTexto(post) {
  const c = post.capa;
  const comp = (c.comparativo || []).slice(0, 2);
  const h = fit(c.manchete, [[40, 128], [60, 112], [80, 96], [110, 84], [999, 72]]);
  const compHtml = comp.length
    ? `<div style="display:grid;grid-template-columns:repeat(${comp.length},minmax(0,1fr));border-top:2px solid #0E0E0C;border-bottom:2px solid #0E0E0C;margin-top:auto">
${comp
  .map(
    (x, i) => `<div style="display:flex;flex-direction:column;gap:12px;padding:36px ${i === comp.length - 1 ? 0 : 36}px 36px ${i ? 36 : 0}px;${i < comp.length - 1 ? 'border-right:2px solid #0E0E0C' : ''}">
<span style="${MONO};font-size:18px;letter-spacing:.12em;color:${x.destaque ? '#C2410C' : '#5C5A52'}">${up(x.rotulo)}</span>
<span style="${ARCH};font-weight:800;font-size:${fit(x.valor, [[8, 88], [12, 72], [999, 56]])}px;line-height:1;letter-spacing:-.03em;${x.destaque ? 'color:#C2410C' : ''}">${esc(x.valor)}</span></div>`
  )
  .join('')}</div>`
    : '';
  return `${head}<div data-slide style="width:1080px;height:1350px;background:#F3F1EA;color:#0E0E0C;font-family:Inter,sans-serif;padding:80px;display:flex;flex-direction:column;gap:56px;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0E0E0C;padding-bottom:28px">
<div style="display:flex;align-items:center;gap:12px">${anel('#0E0E0C')}<span style="${ARCH};font-weight:900;font-size:38px;letter-spacing:-.04em">rodada</span></div>
<span style="${MONO};font-weight:700;font-size:20px;letter-spacing:.14em">${up(post.editoria)}</span></div>
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.95;letter-spacing:-.01em;text-transform:uppercase">${esc(c.manchete)}</h1>
${c.subtitulo ? `<p style="margin:0;font-size:30px;line-height:1.4;color:#3D3B35">${esc(c.subtitulo)}</p>` : ''}
${compHtml}
<div style="display:flex;justify-content:space-between;align-items:center;${comp.length ? '' : 'margin-top:auto;'}${MONO};font-size:18px;letter-spacing:.08em;color:#5C5A52">
<span>FONTE: ${up(post.fonte)}</span><span style="color:#0E0E0C">ARRASTA →</span></div></div>${foot}`;
}

function capaFoto(post) {
  const c = post.capa;
  const h = fit(c.manchete, [[50, 104], [75, 92], [100, 80], [999, 68]]);
  return `${head}<div data-slide style="width:1080px;height:1350px;position:relative;overflow:hidden;background:#1C1B18;color:#F3F1EA;font-family:Inter,sans-serif">
<img id="foto" src="${esc(c.foto_url)}" style="position:absolute;left:0;top:0;width:1080px;height:900px;object-fit:cover">
<div style="position:absolute;left:0;bottom:0;width:1080px;height:760px;background:linear-gradient(180deg,rgba(14,14,12,0) 0%,rgba(14,14,12,.85) 38%,#0E0E0C 62%)"></div>
<div style="position:absolute;left:80px;top:80px;right:80px;display:flex;justify-content:space-between;align-items:center">
<div style="display:flex;align-items:center;gap:12px;background:rgba(14,14,12,.6);padding:8px 16px 8px 8px;border-radius:12px">${anel('#F3F1EA', 52)}<span style="${ARCH};font-weight:900;font-size:40px;letter-spacing:-.04em">rodada</span></div>
<span style="${MONO};font-size:20px;letter-spacing:.1em;background:rgba(14,14,12,.6);padding:10px 16px;border-radius:8px">${esc(selo(post))}</span></div>
<div style="position:absolute;left:80px;right:80px;bottom:96px;display:flex;flex-direction:column;gap:28px">
<span style="position:absolute;right:0;top:-64px;${MONO};font-size:16px;letter-spacing:.08em;color:#C9C6BC">FOTO: ${up(c.credito_foto)}</span>
<div style="display:flex;align-items:center;gap:12px"><span style="width:14px;height:14px;border-radius:50%;background:#FF5A1F"></span>
<span style="${MONO};font-weight:700;font-size:24px;letter-spacing:.16em;color:#FF5A1F">${up(post.editoria)}</span></div>
<h1 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.98;letter-spacing:-.01em;text-transform:uppercase">${esc(c.manchete)}</h1>
<div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #2A2925;padding-top:24px;${MONO};font-size:20px;letter-spacing:.1em;color:#8A877E">
<span>@RODADA.TECH</span><span style="color:#F3F1EA">ARRASTA →</span></div></div></div>${foot}`;
}

function contexto(post) {
  const c = post.contexto;
  const h = fit(c.titulo, [[35, 76], [60, 64], [999, 54]]);
  const itens = (c.itens || []).slice(0, 3);
  return `${head}<div data-slide style="width:1080px;height:1350px;background:#0E0E0C;color:#F3F1EA;font-family:Inter,sans-serif;padding:80px;display:flex;flex-direction:column;gap:56px;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;${MONO};font-size:20px;letter-spacing:.14em">
<span style="color:#FF5A1F;font-weight:700">O QUE ACONTECEU</span><span style="color:#8A877E">2/3</span></div>
<h2 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:1;text-transform:uppercase">${esc(c.titulo)}</h2>
<div style="display:flex;flex-direction:column;border-top:2px solid #2A2925">
${itens
  .map(
    (x) => `<div style="display:flex;gap:36px;align-items:baseline;padding:32px 0;border-bottom:2px solid #2A2925">
<span style="${ARCH};font-weight:800;font-size:${fit(x.numero, [[4, 72], [7, 56], [999, 44]])}px;line-height:1;color:#FF5A1F;min-width:220px;max-width:300px">${esc(x.numero)}</span>
<span style="font-size:30px;line-height:1.35">${esc(x.texto)}</span></div>`
  )
  .join('')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;${MONO};font-size:18px;letter-spacing:.08em;color:#8A877E">
<span>FONTE: ${up(post.fonte)}</span><span>@RODADA.TECH</span></div></div>${foot}`;
}

function pratica(post) {
  const p = post.pratica;
  const h = fit(p.titulo, [[30, 96], [50, 80], [999, 64]]);
  return `${head}<div data-slide style="width:1080px;height:1350px;background:#FF5A1F;color:#0E0E0C;font-family:Inter,sans-serif;padding:80px;display:flex;flex-direction:column;gap:48px;overflow:hidden">
<div style="display:flex;justify-content:space-between;align-items:center;${MONO};font-weight:700;font-size:20px;letter-spacing:.14em"><span>E PRA VOCÊ?</span><span>3/3</span></div>
<h2 style="margin:0;${ARCH};font-weight:900;font-stretch:75%;font-size:${h}px;line-height:.96;text-transform:uppercase">${esc(p.titulo)}</h2>
<div style="display:flex;flex-direction:column;gap:20px;font-size:32px;line-height:1.4">
${(p.passos || [])
  .slice(0, 3)
  .map((s, i) => `<div style="display:flex;gap:20px"><span style="${MONO};font-weight:700">0${i + 1}</span><span>${esc(s)}</span></div>`)
  .join('')}</div>
<div style="margin-top:auto;background:#0E0E0C;color:#F3F1EA;border-radius:24px;padding:40px;display:flex;flex-direction:column;gap:16px">
<span style="${MONO};font-size:18px;letter-spacing:.14em;color:#FF5A1F">RODA DE CONVERSA</span>
<span style="${ARCH};font-weight:800;font-size:${fit(p.pergunta, [[70, 46], [999, 38]])}px;line-height:1.1">${esc(p.pergunta)}</span></div>
<div style="display:flex;justify-content:space-between;align-items:center;${MONO};font-weight:700;font-size:20px;letter-spacing:.1em">
<span>SEGUE @RODADA.TECH</span><span>5 NOTÍCIAS POR DIA</span></div></div>${foot}`;
}

function slides(post, { forcarTexto = false } = {}) {
  const capa = !forcarTexto && post.capa.tipo === 'foto' && post.capa.foto_url ? capaFoto(post) : capaTexto(post);
  return [capa, contexto(post), pratica(post)];
}

module.exports = { slides, capaTexto, capaFoto, contexto, pratica };
