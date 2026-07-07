# Build stage: install everything and compile TypeScript to dist/.
FROM node:22-slim AS build

WORKDIR /app
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Runtime stage: production deps only, compiled JS, non-root user, healthcheck.
FROM node:22-slim AS runtime

WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps/api/dist ./apps/api/dist

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Default command runs the API; the worker service overrides this with
# ["node", "apps/api/dist/worker.js"].
CMD ["node", "apps/api/dist/index.js"]
