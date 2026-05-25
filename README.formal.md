# new-api formal stack

This is the recommended production-oriented stack for your project.

Architecture:

- `new-api` as the single admin console and user panel
- `PostgreSQL` for durable application data
- `Redis` for cache and coordination
- `Caddy` for direct public HTTPS when the server can accept `80/443`
- `cloudflared` as an optional public ingress when the server cannot accept inbound `80/443`

## Why this stack

This layout matches your target use case:

- You control everything from one admin console
- Other users get their own accounts, tokens, balance/quota view, logs, and model access
- The database and cache are no longer tied to SQLite
- Public ingress can be swapped between direct HTTPS and Cloudflare Tunnel

## Files

- [docker-compose.formal.yml](D:/sub2api/docker-compose.formal.yml)
- [.env.formal.example](D:/sub2api/.env.formal.example)
- [Caddyfile.formal](D:/sub2api/Caddyfile.formal)

## Recommended domains

- `token688.cn` for the public user portal
- `api.token688.cn` for API clients
- `admin.token688.cn` for the backend/admin panel

This split keeps the portal, API, and admin surface clearly separated.

## Deployment modes

### Mode 1: Direct public HTTPS with Caddy

Use this only when:

- the server really accepts inbound `80/tcp` and `443/tcp`
- DNS points to the server

Start:

```bash
cp .env.formal.example .env.formal
docker compose -f docker-compose.formal.yml up -d
```

### Mode 2: Cloudflare Tunnel

Use this when:

- your server cannot reliably accept inbound `80/443`
- you still want public access

Steps:

1. Keep `new-api`, `postgres`, and `redis` the same.
2. Create a Tunnel in Cloudflare.
3. Put the generated Tunnel token into `.env.formal`:

```env
CLOUDFLARE_TUNNEL_TOKEN=your-token
```

4. Start with the tunnel profile:

```bash
docker compose -f docker-compose.formal.yml --profile tunnel up -d
```

In this mode, `cloudflared` publishes the service and Caddy is optional. If you only need one hostname and Cloudflare manages TLS, you can point the Tunnel directly at `http://127.0.0.1:3000`.

## First production checklist

1. Copy `.env.formal.example` to `.env.formal`
2. Replace all placeholder secrets
3. Confirm `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `SESSION_SECRET`, and `CRYPTO_SECRET` are strong
4. Start the stack
5. Initialize the `new-api` root admin account
6. Disable public registration
7. Create one user per person
8. Create model groups, quotas, and rate limits

## Storage layout

- `./storage/postgres` - PostgreSQL data
- `./storage/redis` - Redis append-only data
- `./storage/new-api` - application local data
- `./storage/caddy` - certificates
- `./logs` - application logs
- `./backups` - manual database dumps

## Backup

Manual database backup:

```bash
docker compose -f docker-compose.formal.yml --profile tools run --rm postgres-backup
```

## What I would use for your case

Given your current server situation, the practical target is:

- `new-api`
- `PostgreSQL`
- `Redis`
- `Cloudflare Tunnel`

That gives you a usable public panel and API even if the host network is restrictive.
