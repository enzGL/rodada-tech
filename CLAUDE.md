# Rodada Tech: instruções da rotina diária

Repositório público com o pipeline do @rodada.tech (Instagram). Quem roda isto é a rotina agendada do Claude Code na nuvem, no ambiente **Rodada** (variáveis `BUFFER_TOKEN`, `IG_TOKEN`, `IG_USER_ID` e `IG_GRAPH_HOST=graph.facebook.com`; o token é do login unificado, começa com EAA).

Nunca usar o travessão "—" em nenhum texto. Usar vírgula, dois-pontos, parênteses ou ponto final.

## Rotinas
| Horário (São Paulo) | O que faz |
|---|---|
| 5h30 | **Rotina "gerar"**: monta a rodada do dia (seção abaixo), faz push e publica o post 01 às 6h. |
| 9h, 12h, 17h, 20h | **Rotina "publicar"** (reserva): `git pull`, `npm ci`, `node publish.js --proximo` (pula o que já foi agendado no Buffer), depois commit e push do `log/`. |

Horários dos posts: 01 = 06:00, 02 = 09:00, 03 = 12:00, 04 = 17:00, 05 = 20:00 (hipótese, ajustar pelas métricas).

## Rotina "gerar" (passo a passo)
1. `npm ci` (ou `npm install`). Data de hoje em America/Sao_Paulo = `AAAA-MM-DD`.
2. **Coletar** notícias das últimas 24h (WebSearch + fontes de `fontes.md`). Temas: IA, startups, funding, dev, ferramentas. Pegar 10 a 15 candidatas.
3. **Checar cada candidata** (regra do Enzo, obrigatória):
   - **Verdadeira?** Fonte primária (anúncio oficial, documento, blog/perfil da empresa) ou 2 veículos confiáveis independentes. O número central do post conferido na fonte. Nada de boato, "segundo rumores", print sem origem.
   - **Interessante?** Nota de 0 a 10 de relevância para dev/founder (novidade, impacto prático, curiosidade). Mínimo 7. Sem fofoca, política ou pauta geral.
   - Falhou em qualquer um: descarta. Sem 5 aprovadas: publica menos. **Nunca publicar sem checar.**
   - Não repetir notícia já publicada (conferir `log/*.jsonl`).
4. **Escrever** um JSON por post em `rodada/AAAA-MM-DD/01.json` ... no formato de `exemplos/01.json` (modelo v2, 2026-11-26):
   - `edicao`, `data`, `horario`, `editoria` (`IA · LANÇAMENTO`, `STARTUPS · FUNDING`, `DEV · FERRAMENTA` etc.), `fonte` (nome curto), `fonte_url`.
   - `fotos` (**obrigatório, regra do Enzo: post sem foto não é publicado**): 1 ou 2 itens, em ordem de preferência:
     1. `{ "pagina": "<url da matéria ou do anúncio>", "credito": "<crédito que a página dá>" }`: usa a og:image. Só serve se for **foto de verdade** (pessoa, produto, lugar, evento). Arte de changelog/blog (logo, texto em fundo liso, banner) não serve.
     2. `{ "commons": "File:<nome>.jpg" }` do Wikimedia Commons (busca: `commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=<termo> filetype:bitmap&prop=imageinfo&iiprop=url|extmetadata`). Licença livre, crédito preenchido sozinho. Boa para CEO, sede, produto, foguete etc.
     3. `{ "url": "<imagem direta>", "credito": "..." }`.
     Crédito sempre real (fotógrafo/agência/"Divulgação/Empresa"); sem crédito conhecido, prefira Commons. Nunca usar foto gerada por IA.
   - `capa`: `{ "manchete", "foto": 1, "posicao": "center 30%" }`. Manchete = **gancho** (número surpreendente, conflito, consequência direta ou pergunta), até ~75 caracteres. Marque 1 trecho com `*asteriscos*` para o destaque laranja.
   - `slides` (2 itens):
     - `{ "tipo": "noticia", "foto": 1|2, "posicao", "dado": { "numero", "rotulo" }, "texto" }`: o que aconteceu, escrito como matéria de jornal (quem, o quê, quando, número central), 180 a 280 caracteres. Um trecho com `*asteriscos*`. `dado` = o número que o gancho prometeu.
     - `{ "tipo": "importa", "foto": 1|2, "texto", "pergunta" }`: por que importa para dev/founder e o que fazer, 160 a 260 caracteres, um trecho com `*asteriscos*`. `pergunta` curta para os comentários.
   - **Nada de** listas 01/02/03, tabela de números, frases de efeito genéricas ("o futuro chegou", "isso muda tudo") nem selo "5 notícias por dia". Texto de jornalista, não de IA.
   - `legenda` (máx. 2200 caracteres, até 15 hashtags): título na 1ª linha, fato no 1º parágrafo, contexto, "Olha o detalhe:", o que fazer, pergunta. Depois: `Fonte: <veículo>`, `Foto: <crédito>` (obrigatória, o publish.js recusa sem ela) e hashtags.
   - `checagem`: `{ "verdadeira": "<fontes conferidas com URL>", "numero_central_conferido": true, "relevancia": <nota> }`. Português correto, sem travessão.
5. **Foto e render**: `node foto.js rodada/AAAA-MM-DD/*.json` (baixa as fotos para a pasta do post). Se falhar ou a foto não servir, troque (outra página, Commons). Sem foto possível: **descarte o post** e use uma reserva. Depois `node render.js rodada/AAAA-MM-DD/*.json` e **olhe os 3 JPEGs** de cada post (ler as imagens): rosto ou objeto principal cortado, foto ruim, texto estourado (AVISO) ou cara de template genérico: ajuste `posicao`, troque a foto ou encurte e renderize de novo.
6. `git add rodada log && git commit -m "rodada AAAA-MM-DD" && git push` (as imagens precisam estar no GitHub: o Instagram baixa pela URL raw).
7. **Agendar no Buffer** (caminho principal desde 2026-11-26): `node buffer.js rodada/AAAA-MM-DD/*.json`. Agenda cada post no seu `horario` (São Paulo) no canal Instagram rodada.tech. O plano Free aceita **no máximo 10 agendados por vez**; o script respeita isso e deixa o excedente para a execução seguinte. Commit e push do `log/`.
   - Reserva: se o Buffer falhar (sem `BUFFER_TOKEN`, rede, erro da API), registre o erro e, se for antes das 06:00, espere até 06:00 e publique o primeiro post com `node publish.js rodada/AAAA-MM-DD/01.json`. A rotina "publicar" cuida dos demais horários. Nunca publique o mesmo post pelos dois caminhos (o log marca `agendado_buffer` e `publicado`).
8. Se algo falhar (token, limite, imagem), registrar o erro no log, não tentar contornar e terminar com um resumo claro do problema.

## Comandos
- `node buffer.js --checar` / `--fila`: confere a chave do Buffer, o canal e a fila (máx. 10).
- `node buffer.js <post.json> --teste`: mostra o que seria agendado.
- `node publish.js --checar`: confere token, conta e limite (100 posts/24h).
- `node publish.js <post.json> --teste`: cria os contêineres sem publicar.
- `node foto.js exemplos/01.json && node render.js exemplos/01.json`: teste do visual.

## Identidade (não alterar sem o Enzo)
Cores: Sinal #FF5A1F, Tinta #0E0E0C, Papel #F3F1EA, Cinza #8A877E. Fontes: Archivo (manchete, condensada 75%, 900), Inter (texto), JetBrains Mono (rótulos). Modelos em `templates.js` (v2, 2026-11-26: capa com foto em tela cheia, slide da notícia com foto e dado, slide "por que importa" com pergunta).
