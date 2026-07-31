#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${SCRIPT_DIR}"
ENV_FILE="${APP_DIR}/.env"
ENV_PROD_FILE="${APP_DIR}/.env.production"
LOG_DIR="${DEPLOY_LOG_DIR:-${SCRIPT_DIR}/deploy-logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/deploy-ui-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee -a "$LOG_FILE") 2>&1

if [[ ! -d "$APP_DIR" ]]; then
  echo "Error: app directory not found at ${APP_DIR}" >&2
  exit 1
fi

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *=* ]] && continue

    local key="${line%%=*}"
    local value="${line#*=}"

    key="${key//[[:space:]]/}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ "$value" == \"*\" && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    if [[ -n "$value" && -z "${!key:-}" ]]; then
      export "${key}=${value}"
    fi
  done < "$file"
}

load_env_file "$ENV_FILE"
load_env_file "$ENV_PROD_FILE"

CONTABO_HOST="${CONTABO_HOST:-169.58.104.219}"

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Error: ${name} is required" >&2
    exit 1
  fi
}

require_var CONTABO_HOST
require_var CONTABO_USER
require_var CONTABO_APP_DIR

CONTABO_PORT="${CONTABO_PORT:-22}"
CONTABO_SSH_KEY="${CONTABO_SSH_KEY:-}"
CONTABO_PM2_APP_NAME="${CONTABO_PM2_APP_NAME:-ui}"
CONTABO_BACKUP_DIR="${CONTABO_BACKUP_DIR:-${CONTABO_APP_DIR%/}.backups}"
CONTABO_KEEP_BACKUPS="${CONTABO_KEEP_BACKUPS:-5}"
CONTABO_HEALTHCHECK_URL="${CONTABO_HEALTHCHECK_URL:-${CONTABO_SITE_URL:-http://${CONTABO_HOST}}}"
CONTABO_UI_HEALTHCHECK_URL="${CONTABO_UI_HEALTHCHECK_URL:-http://127.0.0.1:3000}"
CONTABO_HEALTHCHECK_RETRIES="${CONTABO_HEALTHCHECK_RETRIES:-12}"
CONTABO_HEALTHCHECK_SLEEP="${CONTABO_HEALTHCHECK_SLEEP:-5}"
SKIP_BUILD="${SKIP_BUILD:-0}"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

echo "[$(timestamp)] Starting deploy"
echo "[$(timestamp)] Log file: $LOG_FILE"
echo "[$(timestamp)] Target: ${CONTABO_USER}@${CONTABO_HOST}:${CONTABO_APP_DIR}"
echo "[$(timestamp)] Backups: ${CONTABO_BACKUP_DIR} (keep ${CONTABO_KEEP_BACKUPS})"
echo "[$(timestamp)] Public health check: ${CONTABO_HEALTHCHECK_URL}"
echo "[$(timestamp)] UI health check: ${CONTABO_UI_HEALTHCHECK_URL}"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "[$(timestamp)] Building UI locally..."
  (
    cd "$APP_DIR"
    npm run build
  )
fi

SSH_OPTS=(-p "$CONTABO_PORT")
if [[ -n "$CONTABO_SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$CONTABO_SSH_KEY")
fi

SSH_COMMAND="ssh"
for opt in "${SSH_OPTS[@]}"; do
  SSH_COMMAND+=" $(printf '%q' "$opt")"
done

REMOTE="${CONTABO_USER}@${CONTABO_HOST}"
REMOTE_APP_DIR_ESCAPED="$(printf '%q' "$CONTABO_APP_DIR")"
REMOTE_BACKUP_DIR_ESCAPED="$(printf '%q' "$CONTABO_BACKUP_DIR")"
REMOTE_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REMOTE_BACKUP_FILE_ESCAPED="$(printf '%q' "${CONTABO_BACKUP_DIR%/}/ui-${REMOTE_TIMESTAMP}.tar.gz")"
REMOTE_PM2_APP_NAME_ESCAPED="$(printf '%q' "$CONTABO_PM2_APP_NAME")"
REMOTE_UI_HEALTHCHECK_URL_ESCAPED="$(printf '%q' "$CONTABO_UI_HEALTHCHECK_URL")"

echo "[$(timestamp)] Creating remote directories..."
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "mkdir -p ${REMOTE_APP_DIR_ESCAPED} ${REMOTE_BACKUP_DIR_ESCAPED}"
echo "[$(timestamp)] Creating remote backup before deploy..."
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "set -e; mkdir -p ${REMOTE_BACKUP_DIR_ESCAPED}; if [ -d ${REMOTE_APP_DIR_ESCAPED} ]; then tar -czf ${REMOTE_BACKUP_FILE_ESCAPED} -C ${REMOTE_APP_DIR_ESCAPED} .; fi; cd ${REMOTE_BACKUP_DIR_ESCAPED} && ls -1t ui-*.tar.gz 2>/dev/null | tail -n +$((CONTABO_KEEP_BACKUPS + 1)) | xargs -r rm -f --"

echo "[$(timestamp)] Syncing ui/ to ${REMOTE}:${CONTABO_APP_DIR} ..."
rsync -az --delete --human-readable --itemize-changes --progress \
  -e "$SSH_COMMAND" \
  --exclude '.git' \
  --exclude '.next/cache' \
  --exclude 'node_modules' \
  --exclude 'deploy-logs' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.*.local' \
  "${APP_DIR}/" \
  "${REMOTE}:${CONTABO_APP_DIR}/"

echo "[$(timestamp)] Installing server dependencies..."
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "cd ${REMOTE_APP_DIR_ESCAPED} && npm ci --omit=dev"

echo "[$(timestamp)] Running remote restart command..."
ssh "${SSH_OPTS[@]}" "$REMOTE" \
  "cd ${REMOTE_APP_DIR_ESCAPED} && if pm2 describe ${REMOTE_PM2_APP_NAME_ESCAPED} >/dev/null 2>&1; then pm2 reload ${REMOTE_PM2_APP_NAME_ESCAPED} --update-env; else pm2 start npm --name ${REMOTE_PM2_APP_NAME_ESCAPED} -- start; fi"

echo "[$(timestamp)] Waiting for UI to come back up..."
attempt=1
while (( attempt <= CONTABO_HEALTHCHECK_RETRIES )); do
  if ssh "${SSH_OPTS[@]}" "$REMOTE" "curl -fsS --max-time 10 ${REMOTE_UI_HEALTHCHECK_URL_ESCAPED} >/dev/null"; then
    echo "[$(timestamp)] UI health check passed on attempt ${attempt}"
    break
  fi

  if (( attempt == CONTABO_HEALTHCHECK_RETRIES )); then
    echo "[$(timestamp)] UI health check failed after ${CONTABO_HEALTHCHECK_RETRIES} attempts" >&2
    exit 1
  fi

  echo "[$(timestamp)] UI health check failed, retrying in ${CONTABO_HEALTHCHECK_SLEEP}s..."
  sleep "$CONTABO_HEALTHCHECK_SLEEP"
  attempt=$((attempt + 1))
done

echo "[$(timestamp)] Deployment complete."
echo "[$(timestamp)] Backup stored at ${CONTABO_BACKUP_DIR}/ui-${REMOTE_TIMESTAMP}.tar.gz"
