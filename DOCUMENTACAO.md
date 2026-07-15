# Momentos — App de Fotos Colaborativas para Casamentos

## 1. Visão Geral

**Momentos** é uma aplicação web que transforma os convidados de um casamento em fotógrafos espontâneos. Funciona como uma "câmera descartável / polaroid digital": durante a cerimônia e a festa, os convidados escaneiam um QR Code, tiram fotos direto do navegador e contribuem para um álbum coletivo do casal.

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
- **Frontend:** Vercel, Netlify ou Cloudflare Pages.
- **Backend:** Railway, Render, Fly.io ou ECS/EC2 (AWS).
- **CI/CD:** GitHub Actions.

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

## 3.1 Monetização (Planos)

Cobrança **fixa por evento** (não por foto, não por convidado — foto ilimitada é o argumento de venda). Evento é criado grátis; paga-se para **ativar** o QR Code para os convidados.

| Plano | Preço | O que inclui |
|---|---|---|
| **Degustação** | R$ 0 | 30 fotos, convidados ilimitados, álbum disponível por 7 dias |
| **Momento** | R$ 29,90 | Fotos e convidados ilimitados, álbum por 6 meses, download ZIP |
| **Memória** | R$ 350,00 | Tudo do Momento + retenção 2 anos + casal seleciona 30 fotos e **recebe álbum físico em casa no estilo polaroid** |

Decisões:
- Diferenciação por retenção/extras, nunca por quantidade de fotos.
- Degustação serve de marketing: cada festa expõe o app a dezenas de futuros noivos.
- Gateway sugerido: Mercado Pago (Pix) ou Stripe.
- Custo de infra por evento (~4 GB S3) < R$ 1 — margem alta em todos os planos.
- Plano Memória: fluxo pós-evento de seleção de 30 fotos + integração com fornecedor de impressão (a definir).

---

## 4. Tasks de Desenvolvimento

> Marque `[x]` conforme concluir. Estado atualizado em 2026-07-08.

### Task 1 — Setup do Projeto
- [x] Subtask 1.1: Criar repositório e estrutura de pastas (frontend/backend).
- [x] Subtask 1.2: Configurar Vue 3 + Vite + Tailwind (+ Pinia e Vue Router).
- [ ] Subtask 1.2.1: Adicionar `vite-plugin-pwa` (manifest + service worker).
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
- [x] Subtask 3.0: Tela de planos (Degustação / Momento R$29,90 / Memória R$350) + escolha no fluxo de criação (frontend).
- [ ] Subtask 3.0.1: Integração de pagamento (Mercado Pago/Stripe) para ativar evento.
- [x] Subtask 3.1: Formulário de criação de evento — título, data, local (frontend, rascunho em store Pinia).
- [x] Subtask 3.1.1: Módulo Events no backend (entity, migration, CRUD com ownership, `public_token` único gerado na criação, status `draft`) + fluxo frontend persistindo e dashboard listando eventos.
- [x] Subtask 3.2: Geração do token público + QR Code do evento (`GET /events/:id/qrcode` → dataURL PNG 600px, link `/e/:token`).
- [x] Subtask 3.3: Tela de detalhe do evento com QR — copiar link + baixar PNG (impressão em PDF fica p/ melhoria futura).
- [ ] Subtask 3.4: Configuração de janela de tempo (liberação/expiração).
- [ ] Subtask 3.5: Ativar/desativar moderação de fotos.

### Task 4 — Landing do Convidado (pós-scan)
- [x] Subtask 4.1: Rota pública que valida o token — `GET /guest/events/:token` (sem auth, só dados públicos: título/data/local/status).
- [x] Subtask 4.2: Tela explicativa da dinâmica em 3 passos ("câmera descartável"), mobile-first.
- [x] Subtask 4.3: Captura opcional do primeiro nome (localStorage, sem conta) — enviado junto das fotos na Task 5.
- [x] Subtask 4.4: Tratamento de token inválido (404 → "Convite não encontrado") e evento `expired` ("álbum fechado").

### Task 5 — Captura e Upload de Fotos (Convidado)
- [ ] Subtask 5.1: Acesso à câmera via `getUserMedia` + fallback `input file`.
- [ ] Subtask 5.2: Preview da foto antes de enviar.
- [ ] Subtask 5.3: Compressão/resize no cliente antes do upload.
- [ ] Subtask 5.4: Upload para storage + registro no banco.
- [ ] Subtask 5.5: Feedback de sucesso e "tirar outra".
- [ ] Subtask 5.6: Limite anti-spam por sessão (rate limit).

### Task 6 — Álbum do Casal
- [ ] Subtask 6.1: Galeria de fotos do evento (grid + lazy load).
- [ ] Subtask 6.2: Visualização em tela cheia (lightbox).
- [ ] Subtask 6.3: Moderação: aprovar/rejeitar/excluir foto.
- [ ] Subtask 6.4: Download individual e download do álbum completo (ZIP).
- [ ] Subtask 6.5: Contadores (total de fotos, convidados participantes).

### Task 7 — Painel / Perfil do Casal
- [ ] Subtask 7.1: Dashboard com lista de eventos.
- [ ] Subtask 7.2: Edição de dados do evento.
- [ ] Subtask 7.3: Compartilhamento de link do álbum (visualização pública opcional).

### Task 8 — Qualidade, Segurança e Deploy
- [ ] Subtask 8.1: Regras de acesso (authorization) — convidado só envia, casal só lê o próprio evento.
- [ ] Subtask 8.2: Validação de tipo/tamanho de arquivo no upload.
- [ ] Subtask 8.3: Testes unitários e e2e dos fluxos críticos.
- [ ] Subtask 8.4: Otimização PWA (offline básico, ícones, manifest).
- [ ] Subtask 8.5: Deploy de produção + domínio + HTTPS.
- [ ] Subtask 8.6: LGPD: consentimento de uso de imagem e política de privacidade.

### Task 9 — Extras (Backlog / Pós-MVP)
- [ ] Subtask 9.1: Filtros/molduras estilo polaroid nas fotos.
- [ ] Subtask 9.2: Slideshow ao vivo projetado na festa (telão).
- [ ] Subtask 9.3: Mensagens/recados dos convidados junto da foto.
- [ ] Subtask 9.4: Fluxo do plano Memória — seleção de 30 fotos + pedido do álbum físico polaroid.
- [ ] Subtask 9.5: Notificação ao casal quando álbum atinge X fotos.

---

## 5. Considerações Importantes
- **Câmera no navegador:** iOS Safari exige HTTPS e gesto do usuário para `getUserMedia`; sempre ter o fallback de `input file capture`.
- **Custos de storage:** fotos em alta resolução escalam rápido — definir limite por evento e gerar thumbnails.
- **LGPD / direito de imagem:** exibir aviso de consentimento na tela do convidado.
- **Escala pontual:** picos de upload concentrados nas horas da festa — usar upload direto para o storage (presigned URL) para não sobrecarregar o backend.
