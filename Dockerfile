FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 app

WORKDIR /app

ARG ENV=production
ARG APP_VERSION=unknown
ENV ENV=$ENV \
    APP_VERSION=$APP_VERSION \
    NODE_ENV=production

COPY --from=deps    --chown=app:nodejs /app/node_modules    ./node_modules
COPY --from=builder --chown=app:nodejs /app/prisma          ./prisma
COPY --from=builder --chown=app:nodejs /app/generated       ./generated
COPY --from=builder --chown=app:nodejs /app/dist            ./dist
COPY --from=builder --chown=app:nodejs /app/package.json    ./package.json
COPY --from=builder --chown=app:nodejs /app/prisma.config.ts    ./prisma.config.ts

COPY --chown=app:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER app
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
