# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:20-slim AS build
WORKDIR /app

# instala deps (inclui dev — precisa do @nestjs/cli pra buildar)
COPY package*.json ./
RUN npm ci

# copia código e compila TS -> dist/
COPY . .
RUN npm run build

# ---------- production ----------
FROM node:20-slim AS prod
ENV NODE_ENV=production
WORKDIR /app

# só deps de produção (typeorm, pg, nest runtime, bcrypt, etc.)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# artefatos compilados + entrypoint
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3333

# entrypoint roda migrations e sobe a API
ENTRYPOINT ["./docker-entrypoint.sh"]
