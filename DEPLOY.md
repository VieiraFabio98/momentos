# Deploy em Produção — Momentos (hospedagem Brasil)

> Guia passo a passo para colocar o **Momentos** em produção com infra na região **São Paulo (`sa-east-1` / `gru`)**, minimizando latência para convidados e casais brasileiros.
> Estado do código em 2026-07-30. Corresponde à Subtask 8.5 da `DOCUMENTACAO.md`.

---

## 0. Decisão de stack (região São Paulo)

O guia original da `DOCUMENTACAO.md` sugeria Vercel + Render + Neon. Render e Neon **não têm região no Brasil** — o backend e o banco ficariam nos EUA, com ~120-150 ms de latência extra por request. Como upload de fotos é o caminho crítico (e roda direto cliente→S3, que já está em SP), o gargalo real é a API de assinatura e a leitura de álbum. Abaixo, a stack ajustada para o Brasil:

| Camada | Escolha (Brasil) | Região | Alternativas |
|---|---|---|---|
| Frontend (SPA/PWA) | **Vercel** ou **Cloudflare Pages** | CDN global (edge no Brasil) | Netlify |
| Backend (API NestJS) | **Fly.io** (região `gru`) | São Paulo | VPS BR (Magalu Cloud, Hostinger, Locaweb), Railway |
| Banco (Postgres) | **Supabase** | `sa-east-1` (São Paulo) | AWS RDS `sa-east-1`, Neon (só EUA/EU), Postgres no mesmo VPS |
| Storage (fotos) | **AWS S3** (já configurado) | `sa-east-1` (São Paulo) | Cloudflare R2 (sem região fixa, egress grátis) |
| E-mail | **Brevo** (API HTTP) | — | Resend, Amazon SES `sa-east-1` |
| Domínio | **Registro.br** (`.com.br`) | — | qualquer registrar `.com` |

> **Frontend em CDN**: Vercel/Cloudflare servem estático da edge, então mesmo com a conta nos EUA o usuário brasileiro baixa da POP local. Não precisa "região BR" no frontend.

> **Alternativa tudo-em-um mais barata**: um único **VPS no Brasil** (Magalu Cloud / Hostinger, ~R$ 30-50/mês) rodando backend + Postgres + Nginx (HTTPS via Let's Encrypt) + servindo o build do frontend. Mais controle e custo fixo previsível; em troca você administra o servidor. As seções 3-4 abaixo cobrem o caminho gerenciado (Fly.io + Supabase); o Apêndice A cobre o VPS.

---

## 1. Pré-requisitos (fazer antes)

- [ ] **8.8 — LGPD**: preencher dados do controlador em [`frontend/src/views/PrivacyView.vue`](frontend/src/views/PrivacyView.vue) (hoje `[PLACEHOLDER]`). **Bloqueia divulgação legal.**
- [ ] Registrar domínio no [registro.br](https://registro.br) (ex.: `momentos.com.br`). Custo ~R$ 40/ano.
- [ ] Conta AWS com o bucket S3 `momentos-bucket` já criado em `sa-east-1` (Subtask 1.3.2 — feito).
- [ ] Conta Google Cloud Console (para o `GOOGLE_CLIENT_ID` do login social).
- [ ] Conta Brevo com **remetente verificado** (Senders) e **domínio autenticado** (SPF/DKIM) — sem isso e-mail de recuperação de senha cai em spam.

---

## 2. Variáveis de ambiente

### 2.1 Backend (`backend/.env` → setar no Fly.io / VPS)

| Variável | Valor em produção | Onde obter / observação |
|---|---|---|
| `PORT` | injetado pela plataforma (Fly: `8080`) | Não fixar em `3333`. Fly usa `8080` interno. |
| `NODE_ENV` | `production` | Habilita comportamento de prod. |
| `JWT_SECRET` | **segredo forte aleatório** | Gerar: `openssl rand -base64 48`. Nunca reusar o de dev. |
| `JWT_EXPIRES_IN` | `1d` | Ou `7d` se quiser sessão mais longa. |
| `FRONTEND_URL` | `https://momentos.com.br` | URL pública do frontend. Usado em CORS e links de e-mail. |
| `RESET_TOKEN_TTL_MINUTES` | `30` | TTL do token de reset de senha. |
| `DATABASE_URL` | `postgresql://...` (connection string do Supabase) | Supabase → Project Settings → Database → Connection string (**usar o pooler `:6543` para serverless / `:5432` para conexão direta**). |
| `DATABASE_SSL` | `true` | **Obrigatório** — Supabase/RDS exigem TLS. |
| `GOOGLE_CLIENT_ID` | `xxxx.apps.googleusercontent.com` | Google Cloud Console → Credentials (seção 5). |
| `BREVO_API_KEY` | `xkeysib-...` | Brevo → SMTP & API → API Keys. **Se vazio, cai no `ConsoleMailProvider` e nenhum e-mail sai.** |
| `MAIL_FROM_EMAIL` | `contato@momentos.com.br` | Remetente verificado no Brevo (idealmente no seu domínio). |
| `MAIL_FROM_NAME` | `Momentos` | Nome exibido do remetente. |
| `AWS_ACCESS_KEY_ID` | chave do IAM user | AWS IAM → usuário com política restrita ao bucket. |
| `AWS_SECRET_ACCESS_KEY` | secret do IAM user | Idem. **Nunca commitar.** |
| `AWS_REGION` | `sa-east-1` | São Paulo. Já é o padrão. |
| `S3_BUCKET_NAME` | `momentos-bucket` | Bucket privado existente. |

> **IAM mínimo** para as chaves AWS: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket` apenas no `arn:aws:s3:::momentos-bucket` e `arn:aws:s3:::momentos-bucket/*`. Não usar a chave root.

### 2.2 Frontend (`frontend/.env` → build-time na Vercel/Cloudflare)

| Variável | Valor em produção | Observação |
|---|---|---|
| `VITE_API_URL` | `https://api.momentos.com.br` | URL pública do backend (Fly.io ou subdomínio do VPS). **Sem barra no fim.** |
| `VITE_GOOGLE_CLIENT_ID` | mesmo valor do backend | O botão "Entrar com Google" só aparece com isto. |
| `VITE_UNSPLASH_ACCESS_KEY` | key do Unsplash (opcional) | [unsplash.com/developers](https://unsplash.com/developers). Sem ela, tela de login usa fotos de fallback. Não é crítico. |

> Vars `VITE_*` são **embutidas no build** — trocar exige rebuild/redeploy do frontend, não só reiniciar.

---

## 3. Banco de dados — Supabase (São Paulo)

1. Criar projeto em [supabase.com](https://supabase.com) → região **South America (São Paulo)**.
2. Project Settings → Database → copiar **Connection string** (modo `Session`/`:5432` para o TypeORM rodar migrations com segurança).
3. Setar `DATABASE_URL` e `DATABASE_SSL=true` no backend.
4. Rodar as migrations em produção (uma vez, e a cada deploy com migration nova):
   ```bash
   npm run migration:run:prod   # typeorm -d dist/database/data-source.js migration:run
   ```
   No Fly.io: `fly ssh console` e rodar lá, ou usar como *release command* (seção 4).

> Alternativa **AWS RDS `sa-east-1`**: mesma latência, mais caro e mais administração. Supabase é o caminho gerenciado mais simples com região BR.

---

## 4. Backend — Fly.io (região `gru` São Paulo)

1. Instalar CLI: `curl -L https://fly.io/install.sh | sh` e `fly auth login`.
2. Na pasta `backend/`, criar `fly.toml` apontando região `gru` e criar app: `fly launch --no-deploy --region gru`.
3. Definir os secrets (não vão no `fly.toml`):
   ```bash
   fly secrets set \
     JWT_SECRET="$(openssl rand -base64 48)" \
     DATABASE_URL="postgresql://...supabase..." \
     DATABASE_SSL=true \
     FRONTEND_URL="https://momentos.com.br" \
     GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com" \
     BREVO_API_KEY="xkeysib-..." \
     MAIL_FROM_EMAIL="contato@momentos.com.br" \
     MAIL_FROM_NAME="Momentos" \
     AWS_ACCESS_KEY_ID="..." \
     AWS_SECRET_ACCESS_KEY="..." \
     AWS_REGION=sa-east-1 \
     S3_BUCKET_NAME=momentos-bucket \
     NODE_ENV=production
   ```
4. Build: `npm install && npm run build`. Start: `npm run start:prod` (`node dist/main`).
5. Migrations no deploy — adicionar *release command* no `fly.toml`:
   ```toml
   [deploy]
     release_command = "npm run migration:run:prod"
   ```
6. Deploy: `fly deploy`. Anotar a URL (`https://momentos-api.fly.dev`) → depois apontar `api.momentos.com.br` (seção 7).

> **Sem cold start** no Fly com uma máquina `min_machines_running = 1` (custa ~US$ 2-5/mês). Se deixar escalar a zero, o primeiro request após ocioso demora a subir — ruim para convidado no meio da festa. Recomendo **manter 1 máquina sempre ligada**.

---

## 5. Google OAuth (login social do casal)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create Credentials → OAuth client ID → Web application.
2. **Authorized JavaScript origins**: `https://momentos.com.br`.
3. Copiar o **Client ID** → setar em `GOOGLE_CLIENT_ID` (backend) e `VITE_GOOGLE_CLIENT_ID` (frontend).
4. Configurar a OAuth consent screen (nome do app, e-mail de suporte, logo, links de privacidade → `https://momentos.com.br/privacidade`).

---

## 6. Storage S3 — ajuste de CORS para produção

O bucket já existe em `sa-east-1` (Subtask 1.3.2), mas o CORS hoje libera só `localhost:5173`. Adicionar o domínio de produção:

```json
[
  {
    "AllowedOrigins": ["https://momentos.com.br"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
AWS Console → S3 → `momentos-bucket` → Permissions → CORS. Manter `localhost` numa entrada separada só se ainda for testar local contra o bucket de prod (idealmente use bucket separado para dev).

---

## 7. Frontend + DNS + HTTPS

### 7.1 Deploy frontend (Vercel)
1. Importar repo → **Root Directory: `frontend`**.
2. Build: `npm run build` · Output: `dist`.
3. Env de build: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_UNSPLASH_ACCESS_KEY` (seção 2.2).
4. Adicionar domínio `momentos.com.br` em Project → Domains.

### 7.2 DNS (no Registro.br ou Cloudflare gerenciando o `.com.br`)
| Host | Tipo | Aponta para |
|---|---|---|
| `momentos.com.br` (apex) | `A` / `ALIAS` | conforme instrução da Vercel/Cloudflare Pages |
| `www` | `CNAME` | domínio da Vercel |
| `api` | `CNAME` | `momentos-api.fly.dev` (ou IP `A` do VPS) |

> **HTTPS**: Vercel e Fly.io emitem certificado (Let's Encrypt) automático ao validar o domínio. No VPS, usar `certbot` (Apêndice A). Sem HTTPS o `getUserMedia` (câmera) **não funciona no iOS Safari** — é requisito, não opcional.

---

## 8. Checklist pós-deploy (validar antes de divulgar)

- [ ] `https://momentos.com.br` carrega e o PWA instala no celular.
- [ ] Cadastro + login e-mail/senha funcionam.
- [ ] "Entrar com Google" aparece e loga.
- [ ] E-mail de recuperação de senha **chega na caixa de entrada** (não spam) — testar com Gmail e Outlook.
- [ ] Criar evento → gerar QR Code → escanear com celular → abrir landing do convidado.
- [ ] Convidado tira foto → upload conclui → foto aparece no álbum do casal.
- [ ] Download do álbum (ZIP) funciona.
- [ ] Câmera abre no iOS Safari (exige HTTPS — validar em iPhone real).
- [ ] `PhotoRetentionJob` roda (log no boot). Fotos somem 7 dias após fim do evento.
- [ ] Página de privacidade (`/privacidade`) **sem `[PLACEHOLDER]`**.

---

## 9. Custo mensal estimado (produção enxuta, BR)

| Item | Custo aprox. |
|---|---|
| Domínio `.com.br` | ~R$ 40 / ano |
| Fly.io backend (1 máquina shared-cpu-1x sempre ligada) | ~US$ 3-5 / mês |
| Supabase (free tier: 500 MB DB, suficiente no início) | R$ 0 (paga ao crescer) |
| AWS S3 `sa-east-1` (~4 GB por evento) | < R$ 1 / evento |
| Brevo (free: 300 e-mails/dia) | R$ 0 |
| Vercel (Hobby) | R$ 0 |
| **Total base** | **~R$ 25-30 / mês + storage por evento** |

---

## Apêndice A — Alternativa: VPS único no Brasil

Para custo fixo e controle total (Magalu Cloud, Hostinger VPS, Locaweb — todos com datacenter BR):

1. **Servidor**: Ubuntu 22.04, 1-2 vCPU / 2 GB RAM. Instalar Node 20, Postgres 16, Nginx.
2. **Postgres local**: criar DB `momentos`, usuário e senha; `DATABASE_URL=postgresql://user:pass@localhost:5432/momentos`, `DATABASE_SSL=false` (conexão local).
3. **Backend**: `git clone`, `npm ci && npm run build`, rodar com **PM2** (`pm2 start dist/main.js --name momentos-api`) + `pm2 startup`. Rodar `npm run migration:run:prod`.
4. **Frontend**: `npm ci && npm run build` → servir `frontend/dist` pelo Nginx (bloco estático).
5. **Nginx**: proxy reverso `api.momentos.com.br` → `localhost:3333`; servir estático em `momentos.com.br`.
6. **HTTPS**: `sudo certbot --nginx -d momentos.com.br -d www.momentos.com.br -d api.momentos.com.br`. Renovação automática via cron do certbot.
7. **Firewall**: `ufw allow 22,80,443`; Postgres **não** exposto (só localhost).

Trade-off: mais barato e latência mínima (tudo em SP), mas você vira o responsável por patches, backup do Postgres (`pg_dump` agendado) e uptime.

---

## Referências rápidas de comandos

```bash
# gerar JWT_SECRET forte
openssl rand -base64 48

# migrations em produção (após build)
npm run migration:run:prod

# Fly.io deploy
fly deploy

# backup Postgres (VPS)
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
```
