# Rodada Tech: instruções da rotina diária

Repositório público com o pipeline do @rodada.tech (Instagram). Quem roda isto é a rotina agendada do Claude Code na nuvem, no ambiente **Rodada** (variáveis `BUFFER_TOKEN`, `IG_TOKEN`, `IG_USER_ID` e `IG_GRAPH_HOST=graph.facebook.com`; o token é do login unificado, começa com EAA).

Nunca usar o travessão "—" em nenhum texto. Usar vírgula, dois-pontos, parênteses ou ponto final.

## Estratégia (aprovada pelo Enzo em 2026-11-26)
A conta começou com 0 seguidores: carrossel no feed quase não é entregue a quem não segue. Por isso:
- **Volume: 1 carrossel + 1 Reels por dia** (do mesmo post). Nada de 5 a 7 posts por dia até a conta ter base (~1.000 seguidores, hipótese).
- **Pauta: ecossistema brasileiro primeiro** (startups, founders, VCs, rodadas, aquisições, demissões, brigas públicas checadas), depois big tech com número forte. Uma notícia boa vale mais que cinco medianas.
- **Modelo v4 (3:4, 1080x1440)**, inspirado no @notstartups.ai: protagonista em foto, editoria espaçada, manchete factual; miolo com **print real da matéria/anúncio** (a prova) e 1 a 2 frases curtas; último slide de assinatura "Siga e compartilhe" (automático).
- **Reels**: `reels.js` gera o MP4 9:16 a partir do post v4 e o Buffer agenda como **Trial Reel** (mostrado primeiro a quem não segue).
- Acusação contra pessoa ou empresa (golpe, fraude, crime) só com **2 veículos confiáveis independentes** ou documento oficial; a fala de um perfil de Instagram não basta. Atribuir sempre ("disse X ao Y").

## Rotinas
| Horário (São Paulo) | O que faz |
|---|---|
| 5h30 | **Rotina "gerar"**: monta o post do dia (seção abaixo), faz push e agenda no Buffer: carrossel às 12:00 e Reels às 19:00 (hipótese de horário, ajustar pelas métricas). |
| 9h, 12h, 17h, 20h | **Rotina "publicar"** (reserva): `git pull`, `npm ci`, `node publish.js --proximo` (pula o que já foi agendado no Buffer), depois commit e push do `log/`. |

## Rotina "gerar" (passo a passo)
1. `npm ci` (ou `npm install`). Data de hoje em America/Sao_Paulo = `AAAA-MM-DD`.
2. **Coletar** notícias das últimas 24h (WebSearch + fontes de `fontes.md`, começando pelas brasileiras). Pegar 10 a 15 candidatas.
3. **Checar cada candidata** (regra do Enzo, obrigatória):
   - **Verdadeira?** Fonte primária (anúncio oficial, documento, blog/perfil da empresa) ou 2 veículos confiáveis independentes. O número central conferido na fonte. Nada de boato, "segundo rumores", print sem origem.
   - **Interessante?** Nota de 0 a 10 para dev/founder brasileiro. Mínimo 7. Pesa mais: Brasil, conflito público, número grande, founder/CEO conhecido. Sem fofoca de vida pessoal nem política partidária.
   - Escolher **a melhor** (só 1 post por dia). Sem nenhuma aprovada: não publica.
   - Não repetir notícia já publicada (conferir `log/*.jsonl`).
4. **Escrever** `rodada/AAAA-MM-DD/01.json` no **modelo v4** (exemplo real: `rodada/2026-11-27/01.json`):
   - `versao_modelo: 4`, `formato: "3:4"`, `edicao`, `data`, `horario: "12:00"`, `reel: { "horario": "19:00", "trial": true }`, `editoria` (2 a 3 palavras: "Rodada de investimento", "Venture capital", "Inteligência artificial", "Big tech", "Aquisição", "Demissões"), `fonte`, `fonte_url`.
   - `fotos` (**obrigatório: post sem foto não é publicado**), em ordem:
     1. Foto do protagonista (pessoa, produto, lugar): `{ "pagina": "<url>", "credito": "..." }` (og:image, só se for foto de verdade), `{ "url": "<imagem direta>", "credito": "..." }` ou `{ "commons": "File:<nome>.jpg" }` (Wikimedia Commons, crédito automático).
     2. **Print real** da matéria ou do anúncio: `{ "print": "<url>", "credito": "Reprodução/<veículo>", "largura": 900, "altura": 1000 }` (o foto.js captura a página). Opcional `"seletor"` CSS para recortar um trecho. Nunca montar print falso.
     Crédito sempre real. Nunca foto gerada por IA.
   - `capa`: `{ "manchete", "foto": 1, "posicao": "center 30%", "circulo": { "foto": N, "posicao" } }` (círculo opcional: logo ou 2ª pessoa). Manchete factual e completa, 70 a 110 caracteres, estilo "Quem, fazendo o quê, com qual número". Um trecho com `*asteriscos*` (laranja).
   - `slides` (2 a 3): `{ "foto": N, "encaixe": "moldura" (print/imagem inteira) | "cheia" (foto em cima), "posicao", "texto" }`. Texto curto, 80 a 160 caracteres, frases de jornal; blocos separados por linha em branco; um trecho com `*asteriscos*`. Pelo menos 1 slide com print (a prova). O último slide (assinatura) é automático.
   - **Nada de** frases de efeito genéricas ("o futuro chegou", "isso muda tudo"), listas 01/02/03 ou selos. Texto de jornalista, não de IA.
   - `legenda` (máx. 2200 caracteres, até 12 hashtags): título na 1ª linha, a matéria completa (fato, contexto, "Olha o detalhe:", "Pra quem constrói:"), pergunta para os comentários, "Siga @rodada.tech para a rodada diária de IA, startups e tecnologia." Depois `Fonte: <veículo>`, `Foto: <crédito>` (obrigatória) e hashtags.
   - `checagem`: `{ "verdadeira": "<fontes com URL>", "numero_central_conferido": true, "relevancia": <nota> }`. Português correto, sem travessão.
5. **Foto, render e Reels**: `node foto.js rodada/AAAA-MM-DD/01.json`, `node render.js rodada/AAAA-MM-DD/01.json` e `node reels.js rodada/AAAA-MM-DD/01.json`. **Olhe todos os JPEGs** e 2 quadros do Reels (`ffmpeg -ss 2 -i .../reel.mp4 -frames:v 1 quadro.jpg`): rosto cortado, print ilegível ou com banner tampando, texto estourado (AVISO): ajuste e gere de novo. Sem foto possível: descarte e use a reserva.
6. `git add rodada log && git commit -m "rodada AAAA-MM-DD" && git push` (imagens e vídeo precisam estar no GitHub).
7. **Agendar no Buffer**: `node buffer.js rodada/AAAA-MM-DD/01.json` (agenda o carrossel e o Reels). Fila máx. 10. Commit e push do `log/`.
   - Reserva: se o Buffer falhar, registre o erro; a rotina "publicar" publica o carrossel pela API no horário. O Reels só sai pelo Buffer. Nunca publique o mesmo post pelos dois caminhos.
8. Se algo falhar (token, limite, imagem), registrar no log, não contornar e terminar com um resumo claro.

## Comandos
- `node buffer.js --checar` / `--fila`: confere a chave do Buffer, o canal e a fila (máx. 10).
- `node buffer.js <post.json> --teste`: mostra o que seria agendado.
- `node publish.js --checar`: confere token, conta e limite (100 posts/24h).
- `node publish.js <post.json> --teste`: cria os contêineres sem publicar.
- `node foto.js exemplos/01.json && node render.js exemplos/01.json`: teste do visual.
- `node reels.js <post.json>`: gera o Reels (MP4 9:16) de um post v4.
- `node buffer.js --remover <buffer_id> [...]`: tira posts da fila do Buffer.
- Coautoria (Collab): `"collab": "<usuario>"` no post ou variável `BUFFER_COLLAB`.

## Identidade (não alterar sem o Enzo)
Cores: Sinal #FF5A1F, Tinta #0E0E0C, Papel #F3F1EA, Cinza #8A877E. Fontes: Archivo (manchete, condensada 75%, 900), Inter (texto), JetBrains Mono (rótulos). Modelos em `templates.js`: **v4 (padrão desde 2026-11-26)**, 3:4, capa com protagonista, slides com print/foto e frase curta, assinatura; v2 e modelos de teste A a E continuam disponíveis para posts antigos.
