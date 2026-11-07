#!/usr/bin/env bash
# Deploy the latest `main` to this VPS: pull, install, update DB schema, restart the API.
#
# Usage (on the VPS):   ~/raudevweb/deploy.sh
# Tip: link it once so `~/deploy.sh` always runs the latest version from the repo:
#   ln -sf ~/raudevweb/deploy.sh ~/deploy.sh
#
# The frontend is NOT deployed from here — Cloudflare Pages rebuilds it on every push to `main`.

set -euo pipefail

# Everything lives in a function so bash reads the whole script before running it.
# (`git pull` below may update this very file while it is executing.)
main() {
	# Resolve the repo folder from this script's real location (works through the ~/deploy.sh symlink)
	local repo
	repo="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
	local backend="$repo/apps/backend"
	local service="raudev-api"

	cd "$repo"

	echo "→ Pulling latest main"
	git checkout -q main
	git pull --ff-only

	echo "→ Installing dependencies"
	bun install --frozen-lockfile

	echo "→ Updating database client and tables"
	cd "$backend"
	bunx prisma generate
	# Stops (non-zero exit) instead of deleting data; back up and handle it manually if that happens
	bunx prisma db push

	echo "→ Restarting backend"
	sudo systemctl restart "$service"

	# Use PORT from the backend .env if set, else 3000
	local port
	port="$(grep -E '^PORT=' "$backend/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' || true)"
	port="${port:-3000}"

	echo "→ Waiting for health check on port $port"
	for _ in $(seq 1 15); do
		if curl -fsS "localhost:$port/health" >/dev/null 2>&1; then
			echo "✅ Backend is up ($(git -C "$repo" log -1 --format='%h %s'))"
			return 0
		fi
		sleep 1
	done

	echo "❌ Backend did not come back. Last log lines:"
	journalctl -u "$service" -n 30 --no-pager || true
	return 1
}

main "$@"
exit
