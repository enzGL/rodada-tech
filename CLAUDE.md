# Rodada Tech: instruções da rotina diária

Repositório público com o pipeline do @rodada.tech (Instagram). Quem roda isto é a rotina agendada do Claude Code na nuvem, no ambiente **Rodada** (variáveis `IG_TOKEN`, `IG_USER_ID` e `IG_GRAPH_HOST=graph.facebook.com`; o token é do login unificado, começa com EAA).

Nunca usar o travessão "—" em nenhum texto. Usar vírgula, dois-pontos, parênteses ou ponto final.

## Rotinas
| Horário (São Paulo) | O que faz |
|---|---|
| 5h30 | **Rotina "gerar"**: monta a rodada do dia (seção abaixo), faz push e publica o post 01 às 6h. |
| 9h, 12h, 17h, 20h | **Rotina "publicar"**: `git pull`, `npm ci`, `node publish.js --proximo`, depois commit e push do `log/`. |

Horários dos posts: 01 = 06:00, 02 = 09:00, 03 = 12:00, 04 = 17:00, 05 = 20:00 (hipótese, ajustar pelas métricas).

## Rotina "gerar" (passo a passo)
1. `npm ci` (ou `npm install`). Data de hoje em America/Sao_Paulo = `AAAA-MM-DD`.
2. **Coletar** notícias das últimas 24h (WebSearch + fontes de `fontes.md`). Temas: IA, startups, funding, dev, ferramentas. Pegar 10 a 15 candidatas.
3. **Checar cada candidata** (regra do Enzo, obrigatória):
   - **Verdadeira?** Fonte primária (anúncio oficial, documento, blog/perfil da empresa) ou 2 veículos confiáveis independentes. O número central do post conferido na fonte. Nada de boato, "segundo rumores", print sem origem.
   - **Interessante?** Nota de 0 a 10 de relevância para dev/founder (novidade, impacto prático, curiosidade). Mínimo 7. Sem fofoca, política ou pauta geral.
   - Falhou em qualquer um: descarta. Sem 5 aprovadas: publica menos. **Nunca publicar sem checar.**
   - Não repetir notícia já publicada (conferir `log/*.jsonl`).
4. **Escrever** um JSON por post em `rodada/AAAA-MM-DD/01.json` ... `05.json` no formato de `exemplos/01.json`:
   - `edicao`: número sequencial da rodada (último do log + 1).
   - `capa.manchete` = **gancho**: número surpreendente, conflito, consequência direta ("isso muda X pra você") ou pergunta. Nunca manchete morna. Até ~80 caracteres. O slide 2 entrega o que o gancho prometeu.
   - `capa.tipo`: `"foto"` só com foto oficial de divulgação (press kit, página do anúncio) em URL direta de imagem, com `credito_foto` ("Divulgação/Empresa"). Sem foto oficial: `"texto"` (padrão). `comparativo` é opcional (2 números lado a lado).
   - `editoria`: `IA · LANÇAMENTO`, `STARTUPS · FUNDING`, `DEV · FERRAMENTA` etc.
   - `contexto`: título curto + até 3 itens `{numero, texto}` com números reais da fonte (texto até ~90 caracteres).
   - `pratica`: título + 3 passos práticos + `pergunta` para a comunidade.
   - `fonte` (nome curto do veículo/anúncio), `fonte_url`.
   - `legenda` (máx. 2200 caracteres, até 15 hashtags): título na 1ª linha, fato no 1º parágrafo, contexto, "Olha o detalhe:", o que fazer (passo, prompt ou ferramenta), pergunta no fim. Depois: `Fonte: <veículo>`, `Foto: <crédito>` (se tiver) e hashtags.
   - `checagem`: `{ "verdadeira": "<fontes conferidas com URL>", "numero_central_conferido": true, "relevancia": <nota> }`.
   - `horario`: conforme a tabela acima. Português correto, sem travessão.
5. **Renderizar**: `node render.js rodada/AAAA-MM-DD/*.json`. Olhar os 3 JPEGs de cada post (ler as imagens). Se houver AVISO de estouro ou texto cortado, encurtar e renderizar de novo.
6. `git add rodada log && git commit -m "rodada AAAA-MM-DD" && git push` (as imagens precisam estar no GitHub: o Instagram baixa pela URL raw).
7. Se ainda for antes das 06:00 (America/Sao_Paulo), espere até 06:00 (`sleep`). Então `node publish.js rodada/AAAA-MM-DD/01.json` (publica o 01). Commit e push do `log/`.
8. Se algo falhar (token, limite, imagem), registrar o erro no log, não tentar contornar e terminar com um resumo claro do problema.

## Comandos
- `node publish.js --checar`: confere token, conta e limite (100 posts/24h).
- `node publish.js <post.json> --teste`: cria os contêineres sem publicar.
- `node render.js exemplos/01.json`: teste do visual.

## Identidade (não alterar sem o Enzo)
Cores: Sinal #FF5A1F, Tinta #0E0E0C, Papel #F3F1EA, Cinza #8A877E. Fontes: Archivo (manchete, condensada 75%, 900), Inter (texto), JetBrains Mono (rótulos). Modelos em `templates.js`.
