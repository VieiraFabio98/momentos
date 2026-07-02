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
- **ORM:** Prisma ou TypeORM (Prisma recomendado — migrations e tipagem fortes).
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
| Backend | Node.js + NestJS + Prisma |
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

## 4. Tasks de Desenvolvimento

### Task 1 — Setup do Projeto
- Subtask 1.1: Criar repositório e estrutura de pastas (frontend/backend).
- Subtask 1.2: Configurar Vue 3 + Vite + `vite-plugin-pwa` + Tailwind.
- Subtask 1.3: Configurar backend NestJS + Prisma + `docker-compose` (Postgres) + variáveis de ambiente.
- Subtask 1.3.1: Criar bucket AWS S3 e credenciais IAM (dev/prod).
- Subtask 1.4: Configurar CI/CD básico (GitHub Actions + deploy preview).

### Task 2 — Autenticação do Casal
- Subtask 2.1: Tela de cadastro (e-mail/senha).
- Subtask 2.2: Tela de login + recuperação de senha.
- Subtask 2.3: Login social Google (opcional).
- Subtask 2.4: Proteção de rotas privadas (guard).

### Task 3 — Gestão de Evento (Casal)
- Subtask 3.1: Formulário de criação de evento (título, data, local).
- Subtask 3.2: Geração do token público + QR Code do evento.
- Subtask 3.3: Tela de download/impressão do QR Code (PDF/PNG).
- Subtask 3.4: Configuração de janela de tempo (liberação/expiração).
- Subtask 3.5: Ativar/desativar moderação de fotos.

### Task 4 — Landing do Convidado (pós-scan)
- Subtask 4.1: Rota pública que valida o token do evento.
- Subtask 4.2: Tela explicativa da dinâmica ("câmera descartável").
- Subtask 4.3: Captura opcional do primeiro nome (sem senha).
- Subtask 4.4: Tratamento de token inválido/expirado.

### Task 5 — Captura e Upload de Fotos (Convidado)
- Subtask 5.1: Acesso à câmera via `getUserMedia` + fallback `input file`.
- Subtask 5.2: Preview da foto antes de enviar.
- Subtask 5.3: Compressão/resize no cliente antes do upload.
- Subtask 5.4: Upload para storage + registro no banco.
- Subtask 5.5: Feedback de sucesso e "tirar outra".
- Subtask 5.6: Limite anti-spam por sessão (rate limit).

### Task 6 — Álbum do Casal
- Subtask 6.1: Galeria de fotos do evento (grid + lazy load).
- Subtask 6.2: Visualização em tela cheia (lightbox).
- Subtask 6.3: Moderação: aprovar/rejeitar/excluir foto.
- Subtask 6.4: Download individual e download do álbum completo (ZIP).
- Subtask 6.5: Contadores (total de fotos, convidados participantes).

### Task 7 — Painel / Perfil do Casal
- Subtask 7.1: Dashboard com lista de eventos.
- Subtask 7.2: Edição de dados do evento.
- Subtask 7.3: Compartilhamento de link do álbum (visualização pública opcional).

### Task 8 — Qualidade, Segurança e Deploy
- Subtask 8.1: Regras de acesso (RLS/authorization) — convidado só envia, casal só lê o próprio evento.
- Subtask 8.2: Validação de tipo/tamanho de arquivo no upload.
- Subtask 8.3: Testes unitários e e2e dos fluxos críticos.
- Subtask 8.4: Otimização PWA (offline básico, ícones, manifest).
- Subtask 8.5: Deploy de produção + domínio + HTTPS.
- Subtask 8.6: LGPD: consentimento de uso de imagem e política de privacidade.

### Task 9 — Extras (Backlog / Pós-MVP)
- Subtask 9.1: Filtros/molduras estilo polaroid nas fotos.
- Subtask 9.2: Slideshow ao vivo projetado na festa (telão).
- Subtask 9.3: Mensagens/recados dos convidados junto da foto.
- Subtask 9.4: Planos pagos (limite de fotos/eventos, retenção).
- Subtask 9.5: Notificação ao casal quando álbum atinge X fotos.

---

## 5. Considerações Importantes
- **Câmera no navegador:** iOS Safari exige HTTPS e gesto do usuário para `getUserMedia`; sempre ter o fallback de `input file capture`.
- **Custos de storage:** fotos em alta resolução escalam rápido — definir limite por evento e gerar thumbnails.
- **LGPD / direito de imagem:** exibir aviso de consentimento na tela do convidado.
- **Escala pontual:** picos de upload concentrados nas horas da festa — usar upload direto para o storage (presigned URL) para não sobrecarregar o backend.
