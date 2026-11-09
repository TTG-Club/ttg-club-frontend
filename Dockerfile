FROM node:24.13-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY .npmrc* pnpm-workspace.yaml* ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Проверки как в GitHub «Code Check». Не прошли — сборка падает, и Dokploy
# оставляет работать предыдущую версию.
FROM base AS check
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm nuxt prepare \
    && pnpm run stylelint:workflow \
    && pnpm run lint:workflow \
    && pnpm run type-check \
    && pnpm run test \
    && touch /tmp/checks-passed

FROM base AS build
# Сборка зависит от проверок: без этой строки BuildKit пропустил бы стадию check.
COPY --from=check /tmp/checks-passed /tmp/checks-passed
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm nuxt build

FROM base
COPY --from=build /app/.output/ ./

EXPOSE 3000
CMD ["node", "server/index.mjs"]
