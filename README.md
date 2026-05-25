# new-api minimal deployment

For the production-oriented stack with PostgreSQL and Redis, use [README.formal.md](D:/sub2api/README.formal.md).

This directory contains a minimal single-host deployment for `new-api` behind `Caddy`.

Design choices:

- `new-api` uses SQLite for the first deployment. This is enough for personal use plus a few friends.
- `new-api` is not published directly on a host port. Only `Caddy` is exposed.
- `Caddy` handles the public entrypoint and reverse proxy.
- This setup is for lawful upstream API usage. It is not a browser-session reverse engineering setup.

## Files

- [docker-compose.yml](D:/sub2api/docker-compose.yml)
- [Caddyfile](D:/sub2api/Caddyfile)
- [.env.example](D:/sub2api/.env.example)

## First run

1. Copy the env template.

```powershell
Copy-Item .env.example .env
```

2. Edit `.env`.

Minimum changes:

- Set `SESSION_SECRET` to a long random string.
- Set `CRYPTO_SECRET` to a long random string.
- For local validation, leave `CADDY_HTTP_PORT=8080`.

3. Start the stack.

```powershell
docker compose up -d
```

4. Open the local gateway.

- `http://localhost:8080`

5. Inside `new-api`:

- Create the admin account on first launch if prompted.
- Add your upstream provider keys and channels.
- Create one token per person instead of sharing a single token.
- Restrict available models and set per-user quotas.

## Production cutover

After local validation, switch to a real domain and HTTPS:

1. Point your domain DNS to this server.
2. Update `.env`:

- `DOMAIN=your-domain`
- `LETSENCRYPT_EMAIL=your-email`
- `CADDY_HTTP_PORT=80`

3. Replace [Caddyfile](D:/sub2api/Caddyfile) with a domain-based site block:

```caddy
{$DOMAIN} {
	encode gzip zstd

	request_body {
		max_size 32MB
	}

	header {
		-X-Powered-By
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
	}

	reverse_proxy new-api:3000 {
		header_up X-Forwarded-Proto {scheme}
		header_up X-Forwarded-Host {host}
		header_up X-Real-IP {remote_host}
	}
}
```

4. Restart:

```powershell
docker compose up -d
```

## Production deployment on your server

Prerequisites:

- Docker and Docker Compose installed on the server
- Domain DNS `A` record points to the server public IP
- Server firewall allows `80/tcp`, `443/tcp`, and `443/udp`

Recommended server directory:

```bash
mkdir -p /opt/new-api
cd /opt/new-api
```

Copy these files to the server:

- [docker-compose.yml](D:/sub2api/docker-compose.yml)
- [docker-compose.prod.yml](D:/sub2api/docker-compose.prod.yml)
- [Caddyfile.prod](D:/sub2api/Caddyfile.prod)
- [.env.example](D:/sub2api/.env.example)

Then on the server:

```bash
cp .env.example .env
```

Edit `.env`:

- `DOMAIN=your-domain.example`
- `LETSENCRYPT_EMAIL=you@example.com`
- Keep `NEW_API_PORT=3000`
- Set `SESSION_SECRET` to a long random string
- Set `CRYPTO_SECRET` to a long random string
- Leave `SQL_DSN=` empty for SQLite first deployment
- Leave `REDIS_CONN_STRING=` empty for SQLite first deployment

Start production mode:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Check status:

```bash
docker compose ps
curl https://your-domain.example/api/status
```

If port 80 is already occupied by another web server, stop that service first or move this deployment behind your existing reverse proxy.

## Recommended operating rules

- Do not open registration.
- Do not expose the Docker database or logs publicly.
- Give each friend a separate token.
- Apply quotas and rate limits in `new-api`.
- Keep the image updated because gateway software changes quickly.

## When to upgrade this setup

Move from SQLite to PostgreSQL and Redis if any of these become true:

- You have more than a few regular users.
- You need better concurrency and caching.
- You want multi-node deployment.
- You need more reliable background jobs and accounting.
