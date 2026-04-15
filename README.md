# SupaScale (Supabase Manager)

Self-hosted control plane for running **multiple Supabase Docker stacks** on a single machine, with **Traefik-friendly labels** (no bundled Traefik) and a **Supabase-inspired** UI.

## Features

- First-launch **admin bootstrap** (`/setup`) and session login
- **Projects**: downloads the official Supabase `docker/` assets from GitHub, writes `.env`, generates `docker-compose.traefik.yml`, runs `docker compose up`
- **Domains**: edit API/Studio hostnames; reapplies Traefik labels and reloads the stack
- **Resources**: scrapes **Prometheus node_exporter** (`/api/metrics`) for host charts
- **Logs**: `docker compose logs` per project
- **Tasks** worker (compose pull, backup stubs)
- **Backups** policies (metadata) and **Cloud Storage** targets (S3-compatible credentials encrypted at rest)
- **Settings**: Traefik entrypoints, external network name, cert resolver name

## Run with Docker Compose (recommended)

Run these commands from the **repository root** (the folder that contains `docker-compose.yml`, `Dockerfile`, and `apps/web/`). A shallow or partial clone without `apps/web` will fail the image build.

1. Create the external Traefik network once (name must match `TRAEFIK_NETWORK` / Settings):

```bash
docker network create traefik_net
```

1. Set a strong `SESSION_SECRET` (for example in a `.env` file next to `docker-compose.yml`, or export it in your shell).
2. Build and start:

```bash
docker compose up -d --build
```

1. Open `http://localhost:3333`, complete `/setup`, then create projects.

### Docker socket

The panel must reach the host Docker daemon (`/var/run/docker.sock`). The included image installs the Docker CLI so `docker compose` can drive stacks on the host.

### Dokploy + Traefik on the same host

- Keep **router names unique** — SupaScale prefixes routers with `supascale_<slug>_…`.
- Attach SupaScale stacks to the **same external network** Traefik uses (defaults to `traefik_net`).
- In **Settings**, align **entrypoint** and **cert resolver** names with your Traefik static/dynamic configuration.
- Dokploy services and SupaScale projects can coexist as long as **host rules** and **published ports** do not collide.

### Metrics

`node_exporter` is included in `docker-compose.yml` with host `/proc` mounts so the **Resources** page reflects the host. Point `NODE_EXPORTER_URL` at your exporter if you run it elsewhere.

## Configuration


| Env                 | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `SESSION_SECRET`    | Signing key for sessions + at-rest secret encryption    |
| `DATA_DIR`          | SQLite and local state (default `/app/data` in compose) |
| `PROJECTS_ROOT`     | Generated Supabase project directories                  |
| `NODE_EXPORTER_URL` | Prometheus scrape URL for Resources                     |
| `TRAEFIK_NETWORK`   | External network name used by `docker-compose.yml`      |


## Development

```bash
cd apps/web
npm install
npm run dev
```

SQLite + migrations live under `apps/web/data/` by default.

## License

MIT