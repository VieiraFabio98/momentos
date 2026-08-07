# Deploy no VPS Hostinger — Momentos (Docker + Nginx + Certbot)

Guia prático para subir o **Momentos** num VPS **Hostinger (datacenter Brasil)**, com:

- **Backend NestJS** e **Postgres** em **containers Docker** (compose)
- **Frontend Vue** servido como estático pelo **Nginx no host**
- **Nginx (host)** como reverse proxy + HTTPS via **Certbot/Let's Encrypt**
- **Fotos no AWS S3** (`sa-east-1`) — já configurado, não fica no VPS

> Pré-requisito de fundo: leia o [`DEPLOY.md`](DEPLOY.md) para o significado de cada variável de ambiente (S3, Brevo, Google, Mercado Pago). Este arquivo cobre só o caminho **VPS + Docker**.

```
Hostinger VPS (Ubuntu 22.04)
├── Docker compose (docker-compose.prod.yml)
│   ├── postgres:16-alpine   (volume persistente, NÃO exposto)
│   └── api (NestJS)         (expõe só 127.0.0.1:3333)
├── Nginx (host)
│   ├── SEUDOMINIO.com.br      → /var/www/momentos  (frontend build)
│   └── api.SEUDOMINIO.com.br  → 127.0.0.1:3333     (proxy p/ container)
└── Certbot (host) → HTTPS Let's Encrypt (renova sozinho)
```

---

## 0. Antes de tudo: registrar domínio

Let's Encrypt **não emite certificado para IP puro** — precisa de domínio.

1. Registre em [registro.br](https://registro.br) (ex.: `momentos.com.br`, ~R$40/ano) ou qualquer registrar `.com`.
2. Guarde o **IPv4** do VPS (painel Hostinger → VPS → Overview).
3. Crie os registros **DNS** apontando pro IP (no painel do registrar ou Cloudflare):

   | Host | Tipo | Valor |
   |---|---|---|
   | `@` (apex) | `A` | `IP_DO_VPS` |
   | `www` | `A` | `IP_DO_VPS` |
   | `api` | `A` | `IP_DO_VPS` |

4. DNS propaga em minutos a horas. Cheque com `ping SEUDOMINIO.com.br` (tem que responder o IP do VPS).

> Sem domínio ainda? Dá pra testar por IP com `docker compose up` e acessar `http://IP:3333`, mas **sem HTTPS** (câmera no iOS Safari não funciona sem HTTPS). Registre o domínio antes de divulgar.

---

## 1. Criar o VPS na Hostinger

1. Hostinger → VPS → escolher plano **KVM 2** (2 vCPU / 8 GB / NVMe) — folga pra Docker + Postgres.
2. SO: **Ubuntu 22.04** (template limpo, sem painel).
3. Definir senha root (ou já subir sua chave SSH — melhor).
4. Anotar o **IP público**.

---

## 2. Primeiro acesso + segurança básica

Conecta como root:

```bash
ssh root@IP_DO_VPS
```

Cria usuário não-root com sudo (não trabalhe como root):

```bash
adduser deploy
usermod -aG sudo deploy
# copia sua chave SSH pro novo user (rode isso NA SUA MÁQUINA local):
#   ssh-copy-id deploy@IP_DO_VPS
```

Firewall (UFW) — libera só SSH, HTTP, HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

(Opcional recomendado) fail2ban contra brute-force SSH:

```bash
sudo apt update && sudo apt install -y fail2ban
```

A partir daqui, entre como `deploy`: `ssh deploy@IP_DO_VPS`.

---

## 3. Instalar Docker + Docker Compose

```bash
# Docker (script oficial)
curl -fsSL https://get.docker.com | sudo sh

# rodar docker sem sudo
sudo usermod -aG docker $USER
newgrp docker   # aplica o grupo na sessão atual (ou saia e entre de novo)

# testa
docker run --rm hello-world
docker compose version
```

---

## 4. Clonar o projeto

```bash
sudo apt install -y git
git clone SEU_REPO_GIT /opt/momentos   # ou via SSH deploy key
cd /opt/momentos
```

> Repositório privado? Gere uma **deploy key**: `ssh-keygen -t ed25519 -C "vps-momentos"`, adicione a `.pub` em GitHub → repo → Settings → Deploy keys (read-only).

---

## 5. Configurar variáveis de ambiente

```bash
cp .env.production.example .env
nano .env
```

Preencha com atenção:

- `POSTGRES_PASSWORD` — senha forte. **A mesma** dentro de `DATABASE_URL`.
- `DATABASE_URL=postgresql://momentos:SUA_SENHA@postgres:5432/momentos` — host é `postgres` (nome do serviço no compose), **não** `localhost`.
- `JWT_SECRET` — gere: `openssl rand -base64 48`.
- `FRONTEND_URL=https://SEUDOMINIO.com.br` (sem barra no fim).
- `AWS_*` / `S3_BUCKET_NAME` — chaves do IAM restrito ao bucket (ver `DEPLOY.md` §2.1).
- `GOOGLE_CLIENT_ID`, `BREVO_API_KEY`, `MP_ACCESS_TOKEN` — conforme `DEPLOY.md`.

O `.env` está no `.gitignore` — não vai pro git. Confira: `git status` não deve listar `.env`.

---

## 6. Subir backend + Postgres (Docker)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

O que acontece:
1. Builda a imagem do backend (`backend/Dockerfile`, multi-stage).
2. Sobe o Postgres com volume persistente (`postgres_data`).
3. O entrypoint da API **roda as migrations** (`migration:run:prod`) e sobe o NestJS.

Verifica:

```bash
docker compose -f docker-compose.prod.yml ps          # ambos 'Up' / healthy
docker compose -f docker-compose.prod.yml logs -f api  # ver "API rodando..." e migrations OK
curl http://127.0.0.1:3333                             # API responde localmente
```

(Opcional) criar admin que cria eventos sem assinatura — precisa de `ADMIN_*` no `.env`:

```bash
docker compose -f docker-compose.prod.yml exec api node dist/database/seeds/admin.seed.js
```

---

## 7. Build do frontend (sem instalar Node no host)

Gera o `dist/` do Vue usando um container descartável e joga em `/var/www/momentos`:

```bash
sudo mkdir -p /var/www/momentos

docker run --rm \
  -e VITE_API_URL=https://api.SEUDOMINIO.com.br \
  -e VITE_GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID \
  -v /opt/momentos/frontend:/app -w /app \
  node:20-slim sh -c "npm ci && npm run build"

sudo cp -r /opt/momentos/frontend/dist/* /var/www/momentos/
```

> Vars `VITE_*` são **embutidas no build** — se mudar a URL da API ou o Google Client ID depois, precisa **rebuildar e recopiar**, não basta reiniciar nada.

---

## 8. Nginx (host) — reverse proxy + estático

```bash
sudo apt install -y nginx

# usa o template do repo
sudo cp /opt/momentos/deploy/nginx/momentos.conf /etc/nginx/sites-available/momentos

# troca o domínio placeholder pelo seu
sudo sed -i 's/SEUDOMINIO.com.br/momentos.com.br/g' /etc/nginx/sites-available/momentos

# ativa e remove o default
sudo ln -s /etc/nginx/sites-available/momentos /etc/nginx/sites-enabled/momentos
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # testa config
sudo systemctl reload nginx
```

Neste ponto `http://SEUDOMINIO.com.br` já deve servir o frontend (ainda sem HTTPS).

---

## 9. HTTPS com Certbot (Let's Encrypt)

**Só funciona com o DNS já apontando pro VPS** (passo 0).

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx \
  -d SEUDOMINIO.com.br \
  -d www.SEUDOMINIO.com.br \
  -d api.SEUDOMINIO.com.br
```

- Escolha **redirect** (força HTTP→HTTPS) quando perguntar.
- Certbot reescreve o Nginx pra 443 + injeta os certificados.
- Renovação automática já vem via `systemd timer`. Teste: `sudo certbot renew --dry-run`.

Ajuste o **CORS do bucket S3** pra liberar o domínio de produção (`DEPLOY.md` §6).

---

## 10. Checklist final (antes de divulgar)

- [ ] `https://SEUDOMINIO.com.br` carrega e o PWA instala no celular.
- [ ] Cadastro/login e-mail+senha funcionam.
- [ ] "Entrar com Google" aparece e loga (`GOOGLE_CLIENT_ID` certo nos dois lados).
- [ ] E-mail de recuperação chega na **caixa de entrada** (Brevo com sender verificado).
- [ ] Criar evento → QR Code → escanear no celular → landing do convidado abre.
- [ ] Convidado tira foto → upload conclui (direto no S3) → aparece no álbum.
- [ ] Download do álbum (ZIP) funciona.
- [ ] Câmera abre no **iOS Safari** (exige HTTPS — testar em iPhone real).
- [ ] Página `/privacidade` sem `[PLACEHOLDER]` (LGPD).

---

## Operação do dia a dia

```bash
cd /opt/momentos

# ver logs da API
docker compose -f docker-compose.prod.yml logs -f api

# reiniciar API
docker compose -f docker-compose.prod.yml restart api

# parar tudo (dados do Postgres ficam no volume)
docker compose -f docker-compose.prod.yml down
```

### Deploy de nova versão

```bash
cd /opt/momentos
git pull

# backend (rebuild + migrations rodam no entrypoint)
docker compose -f docker-compose.prod.yml up -d --build api

# frontend (rebuild + recopiar)
docker run --rm \
  -e VITE_API_URL=https://api.SEUDOMINIO.com.br \
  -e VITE_GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID \
  -v /opt/momentos/frontend:/app -w /app \
  node:20-slim sh -c "npm ci && npm run build"
sudo cp -r /opt/momentos/frontend/dist/* /var/www/momentos/
```

### Backup do Postgres (agende no cron)

```bash
# dump manual
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U momentos momentos > /opt/momentos/backup_$(date +%F).sql

# cron diário às 3h (crontab -e):
# 0 3 * * * cd /opt/momentos && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U momentos momentos > /opt/momentos/backup_$(date +\%F).sql
```

> **Fotos** não entram no backup do Postgres — elas vivem no S3 (durável por padrão). O banco guarda só metadados.

---

## Notas de segurança

- Postgres **não** tem `ports:` no compose → inacessível da internet, só pela rede interna do Docker.
- API só escuta em `127.0.0.1:3333` → só o Nginx do host alcança; nunca exposta direto.
- UFW só abre 22/80/443.
- `.env` fora do git (`.gitignore`).
- Use chave SSH (não senha) e mantenha o sistema atualizado: `sudo apt update && sudo apt upgrade`.
