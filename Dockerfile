# Build from repository root: docker compose build / docker build -f Dockerfile .
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# docker.io: CLI to talk to host socket. Compose v2 plugin: GitHub release (works on amd64 + arm64; Debian apt has no docker-compose-plugin on some arches).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl docker.io \
  && rm -rf /var/lib/apt/lists/* \
  && ARCH=$(uname -m) \
  && case "$ARCH" in \
       x86_64) DARCH=x86_64 ;; \
       aarch64) DARCH=aarch64 ;; \
       armv7l) DARCH=armv7 ;; \
       *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
     esac \
  && mkdir -p /usr/local/lib/docker/cli-plugins \
  && curl -fsSL "https://github.com/docker/compose/releases/download/v2.31.0/docker-compose-linux-${DARCH}" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose \
  && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle

# Next standalone uses HOSTNAME for bind address; Docker sets HOSTNAME to the container ID unless overridden.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
