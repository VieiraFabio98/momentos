#!/bin/sh
set -e

echo "==> Rodando migrations (typeorm)..."
npm run migration:run:prod

echo "==> Iniciando API NestJS..."
exec node dist/main
