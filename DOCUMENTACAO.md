# Momentos — App de Fotos Colaborativas para Casamentos

## 1. Visão Geral

**Momentos** é uma aplicação web que transforma os convidados de um casamento em fotógrafos espontâneos. Funciona como uma "câmera instantânea / polaroid digital": durante a cerimônia e a festa, os convidados escaneiam um QR Code, tiram fotos direto do navegador e contribuem para um álbum coletivo do casal.

### Proposta de valor
- Captura de momentos genuínos, do ponto de vista dos convidados.
- Zero fricção: convidado **não cria conta** e **não instala app**.
- Álbum centralizado disponível no perfil do casal após a festa.

### Fluxo principal
1. Casal cria conta e cadastra o evento (nome, data, local).
2. Sistema gera um QR Code único do evento.
3. QR Code é impresso/exibido na festa (mesas, painéis, convites).
4. Convidado escaneia → abre tela explicativa da dinâmica.
5. Convidado tira/envia fotos pelo navegador (sem login).
6. Fotos entram no álbum do evento (moderação opcional).
7. Após a festa, casal acessa, visualiza e baixa o álbum completo.

### Regras de negócio
- Apenas **uma** pessoa do casal precisa de conta (noivo **ou** noiva).
- Convidados são anônimos (opcional: pedir só o primeiro nome, sem senha).
- Aplicação 100% web — sem APK/app nativo.
- Cada evento tem janela de tempo (ex.: fotos liberadas só durante e X dias após).

---

## 2. Arquitetura & Tecnologias Sugeridas

### Frontend (Web SPA/PWA)
- **Framework:** Vue 3 + Vite (Composition API, `<script setup>`).
  - Estado: Pinia. Rotas: Vue Router. Opcional SSR/rotas file-based: Nuxt.
  - Alternativas válidas: React + Vite, SvelteKit ou Angular.
- **PWA:** `vite-plugin-pwa` (Service Worker) para experiência tipo app no celular do convidado (sem instalar loja).
- **Captura de foto:** API `getUserMedia` (câmera) + `<input type="file" accept="image/*" capture="environment">` como fallback. APIs web, independentes de framework.
- **UI:** Tailwind CSS (ou PrimeVue / Vuetify).
- **QR scan (lado convidado):** normalmente o app nativo de câmera do celular já lê o QR e abre a URL — não precisa scanner no app. QR é só um link com token do evento.

### Backend (API)
- **Node.js + NestJS** (TypeScript ponta a ponta com o front Vue).
- **ORM:** TypeORM (migrations via CLI, `SnakeNamingStrategy` p/ camelCase↔snake_case).
- **Validação:** `class-validator` + `class-transformer` (DTOs).

### Banco de Dados
- **PostgreSQL**.
- **Dev:** rodando via Docker (`docker-compose` com serviço Postgres).
- Tabelas base: `users`, `events`, `photos`, `guests` (opcional).

### Armazenamento de Imagens
- **AWS S3** (bucket privado; acesso via presigned URL).
- Upload direto cliente → S3 via presigned URL (backend só assina, não trafega o arquivo).
- Gerar thumbnails (Sharp) — em Lambda no evento S3, ou no backend no ato do registro.

### Autenticação
- Só para o casal: e-mail/senha (bcrypt) + JWT (NestJS + Passport). OAuth Google opcional.
- Convidado: token de evento na URL (JWT assinado/expira), sem login.

### Geração de QR Code
- Lib `qrcode` (Node) gerando PNG/SVG do link do evento com token.

### Infra / Deploy
- **Dev:** `docker-compose` (Postgres + backend NestJS). Frontend via `vite dev`.
- **Produção (free tier):** Vercel (frontend) + Render (backend) + Neon (Postgres) + AWS S3 (fotos; migrar p/ Cloudflare R2 quando o free tier AWS vencer — API compatível, troca só o endpoint no `S3StorageProvider`).
- **CI/CD:** GitHub Actions.

#### Deploy passo a passo (free tier)
1. **Neon:** criar projeto → copiar connection string.
2. **Render (Web Service):**
   - Root dir `backend`, build `npm install && npm run build`, start `npm run start:prod`.
   - Envs: `DATABASE_URL` (Neon), `DATABASE_SSL=true`, `JWT_SECRET` (forte), `FRONTEND_URL` (URL da Vercel), `GOOGLE_CLIENT_ID`, `AWS_*`, `S3_BUCKET_NAME`, `PORT` (Render injeta).
   - Migrations: rodar `npm run migration:run:prod` (pre-deploy command ou shell).
3. **Vercel:** root dir `frontend`, env de build `VITE_API_URL` (URL do Render) + `VITE_GOOGLE_CLIENT_ID` + `VITE_UNSPLASH_ACCESS_KEY`.
4. **Bucket S3:** adicionar domínio da Vercel no CORS.
5. **Google Cloud Console:** adicionar origem da Vercel no OAuth.
6. **Cold start Render free:** dorme após 15 min (~50s pra acordar). Mitigar com ping do UptimeRobot ou plano pago.
7. **E-mail:** trocar `ConsoleMailProvider` por Resend/Brevo (grátis) antes de divulgar — recuperação de senha depende disso.

### Stack definida (resumo)
| Camada | Escolha |
|---|---|
| Frontend | Vue 3 + Vite (PWA) + Tailwind |
| Backend | Node.js + NestJS + TypeORM |
| Banco | PostgreSQL (dev via Docker) |
| Storage | AWS S3 (presigned URL) |
| Auth casal | JWT + Passport (bcrypt) |
| QR | lib `qrcode` |

---

## 3. Modelo de Dados (rascunho)

```
users        (id, nome, email, senha_hash, created_at)
events       (id, user_id, titulo, data_evento, local, token_publico, status, expira_em, created_at)
photos       (id, event_id, url, thumb_url, guest_nome?, aprovada, created_at)
guests       (id, event_id, nome?, session_token, created_at)   -- opcional
```

---

## 3.1 Monetização (Planos) — OBSOLETO (substituído por §3.2)

> ⚠️ **Modelo antigo B2C por-evento, descontinuado.** O plano deixou de morar no
> evento e virou **assinatura da conta** (mensal/anual, §3.2). Degustação/Momento/
> Memória e o limite de 30 fotos foram removidos do código. Mantido aqui só como
> registro histórico; o que vale é a §3.2 + a §3.3 (implementação da assinatura).

Modelo antigo (não mais em vigor): cobrança fixa por evento — Degustação R$ 0 (30
fotos), Momento R$ 29,90, Memória R$ 350 (álbum físico polaroid).

> **Retenção (ainda em vigor):** as fotos ficam disponíveis por **7 dias após o
> encerramento do evento** e depois são excluídas. É o prazo declarado na Política de
> Privacidade — mudar aqui exige mudar lá também.

---

## 3.3 Monetização B2B — Implementação (EM VIGOR, sem gateway)

Assinatura da cerimonialista mora no **`user`** (`subscription_plan`: `mensal`|`anual`|
null). Escopo entregue **sem gateway de pagamento** — escolher um plano só grava a
escolha na conta, sem cobrança nem status de pagamento.

| Plano | Preço | Cobrança |
|---|---|---|
| **Mensal** | R$ 49,99 | por mês; eventos ilimitados; pode congelar na baixa (a implementar) |
| **Anual** | R$ 499 | por ano (~2 meses grátis); preço travado |

O que foi feito:
- **Backend:** coluna `users.subscription_plan` (migration `AddUserSubscriptionPlan`);
  `PATCH users/:id/subscription` (`SetSubscriptionUseCase`, ownership, 404 p/ conta
  alheia); plano exposto em `/auth/me` e nas respostas de usuário.
- **Evento perdeu `plan`** (migration `DropEventPlan`): DTOs, entity, use-cases e o
  limite de fotos por evento (`PLAN_PHOTO_LIMITS`/degustação 30) removidos. Todo
  evento é ilimitado agora. Criar evento não pergunta mais plano.
- **Frontend:** `PlansView` virou **tela de assinatura da conta** (mensal/anual),
  fora do fluxo de criar evento, em `/assinatura` (link no dashboard). `EventCreateView`
  cria o evento direto. Dashboard perdeu o badge de plano; excluir evento agora vale
  para qualquer evento (antes só degustação).

Ainda em aberto (fases futuras): gateway de pagamento (Mercado Pago/Stripe), gate de
assinatura ativa para criar evento, congelamento (pausa) com trava, preço anual final.

---

## 3.2 Monetização B2B — Cerimonialistas (EM AVALIAÇÃO / GRELHA)

> Pivô em estudo: em vez de vender por evento ao casal (§3.1), vender **assinatura
> para cerimonialistas** (wedding planners), que revendem/embutem no serviço delas.
> Ainda não decidido — decisões abaixo registradas conforme fecham na sessão de grelha.

Decisões fechadas:
- **Moderação = valor, não fardo.** Cerimonialista aceita revisar fotos porque vira
  **controle de qualidade** dela — feature de marca ("álbum curado por [nome]") que
  ela usa p/ justificar o próprio preço ao casal. Não é só filtro de conteúdo impróprio.
- **Moderação = curadoria via lixeira + gate de liberação (reaproveita código atual).**
  Álbum mostra todas as fotos na visão da cerimonialista; ela apaga o que não quer pela
  lixeira (§6.3, já existe). O casal **não** vê ao vivo: só recebe um **link público
  read-only depois** que ela clica "liberar álbum". Assim o casal só enxerga o resultado
  curado, cumprindo a promessa de "álbum curado", sem construir fila de aprovação.
  Pré-filtro IA (nudez/borrão/duplicata marcando duvidosas) fica como **assist futuro
  opcional** p/ reduzir o trabalho manual — não é pré-requisito do lançamento B2B.
- **Cobrança: assinatura mensal fixa, eventos ilimitados.** R$ 49,99/mês. Sem taxa
  por evento e sem cap de eventos — custo de infra/evento < R$ 1, margem aguenta o
  ilimitado e o pitch fica limpo ("quantos casamentos quiser").
- **Plano anual** com desconto (~R$ 499/ano ≈ 2 meses grátis) = oferta principal.
  Trava o ano, receita adiantada, dilui a baixa temporada. Mensal = porta de entrada.
- **Congelamento (pausa) só no plano mensal**; anual não tem (já diluído). Trava dura:
  **máx 3 meses de pausa por ano E álbuns ficam read-only enquanto pausado.** Evita
  virar hospedagem grátis na baixa temporada.

- **Dono do evento = cerimonialista.** Ela cria o evento, modera e entrega. **Casal não
  cria conta** — recebe álbum via link público read-only. Só o planner loga (auth
  simplificada). Bate com "álbum curado por [nome da cerimonialista]".
- **B2B primeiro, B2C (§3.1) congelado.** Foca cerimonialista (paga mais, tem verba)
  sem apagar o código B2C — que fica dormindo, sem investimento. Reabre B2C se B2B não
  pegar. Não manter os dois modos ativos ao mesmo tempo (dobraria auth/planos/suporte).

Impacto no que já existe / a construir:
- **Novo:** gate "liberar álbum" (gera link read-only do casal só após curadoria).
  ✅ **Implementado** — ver Subtask 6.6.
- **Novo:** conta/onboarding de cerimonialista + billing de assinatura (mensal/anual +
  congelamento com trava). Substitui/estende o billing por-evento do §3.1.
- **Reaproveita:** captura do convidado (Task 5), álbum + lixeira (Task 6), telão (9.2,
  segue sem moderação), retenção de fotos (8.7).
- **Marca do planner** no link do casal ("curado por [nome]") — feature de branding leve.

Em aberto (a grelhar depois):
- Onde a marca da cerimonialista aparece (logo no álbum? no telão? no QR?).
- Congelamento (pausa) do plano mensal + gateway de pagamento (ver §3.3).

> Implementação da assinatura (sem gateway) já entregue — ver **§3.3**.

---

## 4. Tasks de Desenvolvimento

> Marque `[x]` conforme concluir. Estado atualizado em 2026-07-26.

### Task 1 — Setup do Projeto
- [x] Subtask 1.1: Criar repositório e estrutura de pastas (frontend/backend).
- [x] Subtask 1.2: Configurar Vue 3 + Vite + Tailwind (+ Pinia e Vue Router).
- [x] Subtask 1.2.1: Adicionar `vite-plugin-pwa` (manifest + service worker).
- [x] Subtask 1.3: Configurar backend NestJS + TypeORM + `docker-compose` (Postgres) + variáveis de ambiente.
- [x] Subtask 1.3.1: Migrations TypeORM configuradas (`migration:generate/run/revert`) + `SnakeNamingStrategy`.
- [x] Subtask 1.3.2: Bucket S3 `momentos-bucket` (sa-east-1) — privado (public access block), CORS p/ localhost:5173, presigned URL testada. SDK `@aws-sdk/client-s3` instalado.
- [ ] Subtask 1.4: Configurar CI/CD básico (GitHub Actions + deploy preview).

### Task 2 — Usuários & Autenticação do Casal
- [x] Subtask 2.1: Módulo Users no backend — CRUD completo (clean arch: domain/application/infra, repositórios read/write, hash bcrypt, DTOs validados, helpers HTTP).
- [x] Subtask 2.2: Migration `users` aplicada no Postgres.
- [x] Subtask 2.3: Tela de login/cadastro/recuperação (frontend, split 65/35 com Unsplash, responsiva, integrada ao `POST /users`).
- [x] Subtask 2.4: Módulo Auth no backend — `POST /auth/login` (JWT via `@nestjs/jwt`) + `GET /auth/me` + `JwtAuthGuard`.
- [x] Subtask 2.5: Recuperação de senha — `POST /auth/forgot-password` + `POST /auth/reset-password` (token sha256 c/ expiração, `IMailProvider` — dev: console; prod: trocar por SES/Resend) + tela `/reset-password`.
- [x] Subtask 2.6: Login social Google — `POST /auth/google` (Google Identity Services, find-or-create, `password_hash` nullable). Pendente só criar `GOOGLE_CLIENT_ID` no Google Cloud Console e preencher nos `.env`.
- [x] Subtask 2.7: Proteção de rotas privadas no frontend (guard no Vue Router + store Pinia + token em localStorage + dashboard).

### Task 3 — Gestão de Evento (Casal)
- [x] Subtask 3.0: ~~Tela de planos por evento~~ → **substituída** por assinatura da
  conta (mensal/anual, §3.3). Tela agora é `/assinatura`, fora do fluxo de criar evento.
- [ ] Subtask 3.0.1: Integração de pagamento (Mercado Pago/Stripe) — assinatura da conta, não por evento. Pendente (modelo atual grava plano sem cobrar).
- [x] Subtask 3.1: Formulário de criação de evento — título, data, local (frontend, rascunho em store Pinia).
- [x] Subtask 3.1.1: Módulo Events no backend (entity, migration, CRUD com ownership, `public_token` único gerado na criação, status `draft`) + fluxo frontend persistindo e dashboard listando eventos.
- [x] Subtask 3.2: Geração do token público + QR Code do evento (`GET /events/:id/qrcode` → dataURL PNG 600px, link `/e/:token`).
- [x] Subtask 3.3: Tela de detalhe do evento com QR — copiar link + baixar PNG (impressão em PDF fica p/ melhoria futura).
- [x] Subtask 3.4: Configuração de janela de tempo — `opens_at`/`expires_at` no evento, definida na criação (horário início/fim, vira dia seguinte se fim ≤ início) e editável no detalhe (datetime-local); guest recebe `windowState` (`upcoming`/`open`/`closed`) e presign bloqueia fora da janela.
- [ ] Subtask 3.5: Ativar/desativar moderação de fotos.

### Task 4 — Landing do Convidado (pós-scan)
- [x] Subtask 4.1: Rota pública que valida o token — `GET /guest/events/:token` (sem auth, só dados públicos: título/data/local/status).
- [x] Subtask 4.2: Tela explicativa da dinâmica em 3 passos ("câmera instantânea"), mobile-first.
- [x] Subtask 4.3: Captura opcional do primeiro nome (localStorage, sem conta) — enviado junto das fotos na Task 5.
- [x] Subtask 4.4: Tratamento de token inválido (404 → "Convite não encontrado") e evento `expired` ("álbum fechado").

### Task 5 — Captura e Upload de Fotos (Convidado)
- [x] Subtask 5.1: Acesso à câmera via `getUserMedia` (traseira, fullscreen) + fallback `input file capture`.
- [x] Subtask 5.2: Preview da foto antes de enviar ("Tirar outra" / "Enviar momento").
- [x] Subtask 5.3: Compressão/resize no cliente (canvas, máx 1920px, JPEG q0.8 — fotos ~20-25 KB no teste).
- [x] Subtask 5.4: Upload direto pro S3 via presigned URL (backend só assina) + confirmação registra no banco (valida existência no S3 e prefixo da key).
- [x] Subtask 5.5: Feedback de sucesso — contador "N momentos enviados ✨" + volta pra câmera.
- [ ] Subtask 5.6: Rate limit por sessão (limite de 30 fotos do plano Degustação já implementado no presign; throttle por IP/sessão fica p/ Task 8).

### Task 6 — Álbum do Casal
- [x] Subtask 6.1: Galeria de fotos no detalhe do evento — `GET /events/:id/photos` (ownership, presigned GET por foto), grid responsivo + lazy load + nome do convidado.
- [x] Subtask 6.2: Visualização em tela cheia (lightbox com anterior/próxima e crédito do convidado).
- [x] Subtask 6.3: Moderação **pós-publicação** — a foto sempre aparece no álbum e o casal exclui o que não quiser, via lixeira no canto inferior direito de cada foto (`DELETE /events/:id/photos/:photoId`: apaga do S3 e do banco, com confirmação). Aprovar/rejeitar **não** foi feito de propósito: só o casal vê o álbum hoje, então uma fila de aprovação daria trabalho sem proteger ninguém. Revisar quando existir superfície pública — slideshow no telão (9.2) ou álbum público (7.3).
- [x] Subtask 6.4: Download individual (presigned GET c/ `Content-Disposition: attachment` no lightbox) e download do álbum completo — `GET /events/:id/photos/archive` streama ZIP (archiver, store) direto do S3.
- [x] Subtask 6.5: Contadores (total de momentos + convidados participantes distintos).
- [x] Subtask 6.6: Liberar álbum curado ao casal (B2B, §3.2). Dono (cerimonialista)
  cura via lixeira (6.3) e libera um link público read-only: `album_token` +
  `album_released_at` no evento. `POST/GET/DELETE events/:id/album-link`
  (liberar idempotente / consultar / revogar) e rota pública sem auth
  `GET album/events/:albumToken` (+ `/archive` ZIP) que 404 enquanto não liberado.
  Frontend: card "Álbum do casal" no detalhe + view pública `/album/:token`
  (galeria read-only, sem lixeira, download). Revogar mata o link; liberar de novo
  gera token diferente. Não toca billing/plano — funciona por cima do que existe.

### Task 7 — Painel / Perfil do Casal
- [x] Subtask 7.1: Dashboard com lista de eventos (plano, status, exclusão com confirmação).
- [x] Subtask 7.2: Edição de dados do evento — modal "Editar evento" no detalhe (título/data/local) via `PATCH /events/:id`.
- [ ] Subtask 7.3: Compartilhamento de link do álbum (visualização pública opcional).
- [x] Subtask 7.4: Tela da conta (`/perfil`) — editar nome e e-mail, trocar senha e pedir o link de recuperação por e-mail. Trocar senha ou e-mail exige a senha atual (`currentPassword` no `PATCH /users/:id`); conta só-Google não tem senha para conferir e a tela vira "criar senha", decidido pelo campo `hasPassword` do `/auth/me`.

### Task 8 — Qualidade, Segurança e Deploy
- [x] Subtask 8.1: Regras de acesso (authorization) — convidado só envia (rotas `guest/*` são write-only, autorizadas pelo `public_token`), casal só lê o próprio evento (ownership no use case). Módulo Users fechado: `GET /users` (listava todo mundo) removido, `GET/PATCH/DELETE /users/:id` atrás do `JwtAuthGuard` e restritos à própria conta, com 404 em vez de 403 p/ não vazar existência.
- [x] Subtask 8.2: Validação de tipo/tamanho de arquivo no upload.
- [x] Subtask 8.3: Testes unitários dos fluxos críticos (Vitest, `npm test` no backend). E2E com Postgres real ficou para depois.
- [x] Subtask 8.4: Otimização PWA (offline básico, ícones, manifest).
- [ ] Subtask 8.5: Deploy de produção + domínio + HTTPS.
- [x] Subtask 8.6: LGPD: consentimento de uso de imagem e política de privacidade.
- [x] Subtask 8.7: Job de exclusão automática das fotos 7 dias após o fim do evento (`PhotoRetentionJob`: varre no boot e a cada 6h — intervalo, não cron em horário fixo, porque o Render free dorme). Encerramento = fim da janela, ou fim do dia da festa quando não há janela. Apaga por prefixo no S3 (leva junto upload não confirmado), remove as linhas e marca `events.photos_purged_at`, o que torna a varredura idempotente. Mesma promessa fechada nos outros dois pontos: excluir evento agora limpa o storage em **todos** os planos (antes só na degustação) e excluir a conta limpa o storage antes do cascade (antes não limpava nada).
- [ ] Subtask 8.8: Preencher os dados do controlador (nome, CPF/CNPJ, e-mail) em `PrivacyView.vue` — hoje estão como `[PLACEHOLDER]`.

### Task 9 — Extras (Backlog / Pós-MVP)
- [ ] Subtask 9.1: Filtros/molduras estilo polaroid nas fotos.
- [x] Subtask 9.2: Slideshow ao vivo projetado na festa (telão) — rota pública `/telao/:displayToken`, protegida por um **segundo token** (`events.display_token`), separado do `public_token` do QR: o casal passa o link para o DJ sem entregar a conta, e pode gerar um link novo sem invalidar o QR já impresso. Feed em `GET /display/events/:token?since=` (incremental, p/ não reenviar o álbum inteiro a cada consulta na wi-fi do salão). Foto nova fura a fila com selo "acabou de chegar"; foto apagada pela lixeira some do telão; QR de convite fica na tela para atrair mais convidados. Sem moderação prévia, por decisão de produto (boa fé).
- [ ] Subtask 9.3: Mensagens/recados dos convidados junto da foto.
- [ ] Subtask 9.4: Fluxo do plano Memória — seleção de 30 fotos + pedido do álbum físico polaroid.
- [ ] Subtask 9.5: Notificação ao casal quando álbum atinge X fotos.
- [ ] Subtask 9.6: Envio posterior ao evento (offline) — festa sem internet: fotos ficam salvas no dispositivo do convidado (IndexedDB via PWA) e são enviadas depois, quando houver conexão, mesmo com a janela já encerrada (validar via token de sessão da festa).

---

## 5. Considerações Importantes
- **Câmera no navegador:** iOS Safari exige HTTPS e gesto do usuário para `getUserMedia`; sempre ter o fallback de `input file capture`.
- **Custos de storage:** fotos em alta resolução escalam rápido — definir limite por evento e gerar thumbnails.
- **LGPD / direito de imagem:** exibir aviso de consentimento na tela do convidado.
- **Escala pontual:** picos de upload concentrados nas horas da festa — usar upload direto para o storage (presigned URL) para não sobrecarregar o backend.
