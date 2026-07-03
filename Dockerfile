# Runtime image for the Booking API.
#
# This works, but it is a straightforward single-stage build: it installs the
# full dependency set (including dev dependencies), runs the TypeScript entry
# point directly with tsx, runs as the default root user, and declares no
# container-level HEALTHCHECK.

FROM node:22-slim

WORKDIR /app

RUN corepack enable

# Copy the whole workspace and install dependencies.
COPY . .
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "exec", "tsx", "apps/api/src/index.ts"]
