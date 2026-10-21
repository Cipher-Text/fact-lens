#!/usr/bin/env bash
# Starts every Fact Lens app for local development, one after another, each only after the
# previous one answers its health check:
#
#   infrastructure -> migrations and seed -> dev identity provider -> API -> worker -> newsroom -> web
#
#   ./run.sh                 start everything and stay in the foreground (Ctrl-C stops it all)
#   ./run.sh start -d        start everything, then return to the shell
#   ./run.sh stop            stop what a previous start left running
#   ./run.sh status          show what is running
#   ./run.sh logs [name]     follow the logs (idp, api, worker, newsroom, web)
#
# Options for start:  --no-infra  do not try to start Docker services
#                     --no-web    leave out the public web app
#                     -d, --detach
#
# Settings come from the root .env (created from .env.example on first run). Logs and process
# ids are kept in .run/, which git ignores. Works with the bash that ships with macOS (3.2).

set -euo pipefail
cd "$(dirname "$0")"

RUN_DIR=".run"
SERVICES="idp api worker newsroom web"

say()  { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[31mError:\033[0m %s\n' "$*" >&2; exit 1; }

# A setting's value: the shell's if it is set there (it wins, as it does for the apps), otherwise
# the one in .env, otherwise a default. The file is read, never sourced: some values contain spaces.
env_get() {
  local name="$1" value="${!1:-}"
  if [ -z "$value" ] && [ -f .env ]; then value=$(grep -E "^$name=" .env | tail -1 | cut -d= -f2- || true); fi
  value="${value%\"}"; value="${value#\"}"
  if [ -n "$value" ]; then printf '%s' "$value"; else printf '%s' "${2:-}"; fi
}
port_of() { local rest="${1##*:}"; rest="${rest%%/*}"; printf '%s' "$rest"; }
host_of() { local h="${1#*://}"; h="${h#*@}"; h="${h%%[:/]*}"; printf '%s' "$h"; }

port_open() { (exec 3<>"/dev/tcp/${2:-127.0.0.1}/$1") 2>/dev/null; }

# ---- what each service is
svc_script() { case "$1" in idp) echo dev:idp;; api) echo dev:api;; worker) echo dev:worker;; newsroom) echo dev:newsroom;; web) echo dev:web;; esac; }
svc_port() {
  case "$1" in
    idp) env_get DEV_IDP_PORT 4300;;
    api) env_get API_PORT 4000;;
    worker) env_get WORKER_HEALTH_PORT 4100;;
    newsroom) port_of "$(env_get NEWSROOM_BASE_URL http://localhost:3100)";;
    web) echo 3000;;
  esac
}
svc_health() {
  local p; p=$(svc_port "$1")
  case "$1" in
    idp) echo "http://127.0.0.1:$p/.well-known/openid-configuration";;
    api) echo "http://127.0.0.1:$p/health/live";;
    worker) echo "http://127.0.0.1:$p/health";;
    newsroom) echo "http://127.0.0.1:$p/signed-out";;
    web) echo "http://127.0.0.1:$p/";;
  esac
}
svc_label() { case "$1" in idp) echo "dev identity provider";; api) echo "API";; worker) echo "worker";; newsroom) echo "newsroom";; web) echo "public web";; esac; }

pid_file() { echo "$RUN_DIR/$1.pid"; }
log_file() { echo "$RUN_DIR/$1.log"; }
is_running() { [ -f "$(pid_file "$1")" ] && kill -0 "$(cat "$(pid_file "$1")")" 2>/dev/null; }

# Each service is its own process group (job control at start), so stopping it also stops pnpm's
# children. The whole group is signalled even if its leader has already died: a crash can leave the
# real server running under a dead pnpm.
group_alive() { kill -0 -- "-$1" 2>/dev/null; }
stop_service() {
  local name="$1" pid i
  [ -f "$(pid_file "$name")" ] || return 0
  pid=$(cat "$(pid_file "$name")")
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for i in $(seq 1 20); do
    group_alive "$pid" || kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  kill -KILL -- "-$pid" 2>/dev/null || true
  rm -f "$(pid_file "$name")"
}

stop_all() {
  local name rev=""
  for name in $SERVICES; do rev="$name $rev"; done   # stop in the opposite order
  for name in $rev; do
    if [ -f "$(pid_file "$name")" ]; then stop_service "$name"; ok "stopped $(svc_label "$name")"; fi
  done
}

wait_for() {
  local url="$1" seconds="$2" i
  for ((i = 0; i < seconds * 2; i++)); do
    if curl -fs -o /dev/null --max-time 2 "$url" 2>/dev/null; then return 0; fi
    sleep 0.5
  done
  return 1
}

start_service() {
  local name="$1" port url
  port=$(svc_port "$name"); url=$(svc_health "$name")
  if port_open "$port"; then
    die "port $port is already in use, so the $(svc_label "$name") cannot start. Stop what is using it (./run.sh stop if it is a previous run)."
  fi
  : > "$(log_file "$name")"
  set -m   # job control only for the fork, so this service becomes its own process group
  nohup pnpm "$(svc_script "$name")" >> "$(log_file "$name")" 2>&1 &
  echo $! > "$(pid_file "$name")"
  set +m   # and so bash does not print "Terminated" notices later
  printf '  … starting %s on port %s' "$(svc_label "$name")" "$port"
  if wait_for "$url" 90 && is_running "$name"; then
    printf '\r\033[K'; ok "$(svc_label "$name") is up: http://127.0.0.1:$port"
  else
    printf '\r\033[K'
    warn "$(svc_label "$name") did not become healthy. Last log lines:"
    tail -n 25 "$(log_file "$name")" >&2 || true
    stop_all
    die "stopped everything. Full log: $(log_file "$name")"
  fi
}

# The port answering is not enough: the login in DATABASE_URL must work. This only reads.
check_login() {
  local out
  if out=$(DATABASE_URL="$(env_get DATABASE_URL postgres://factlens:factlens@localhost:5432/factlens)" node scripts/check-db.mjs 2>&1); then
    ok "$out"
  else
    printf '%s\n' "$out" >&2
    die "PostgreSQL is running, but DATABASE_URL in .env cannot be used (see above)."
  fi
}

ensure_infra() {
  local db host port
  db=$(env_get DATABASE_URL postgres://factlens:factlens@localhost:5432/factlens)
  host=$(host_of "$db"); port=$(port_of "$db")
  if port_open "$port" "$host"; then ok "PostgreSQL answers on $host:$port"; check_login; return; fi
  [ "$SKIP_INFRA" = "1" ] && die "PostgreSQL is not answering on $host:$port and --no-infra was given."
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    say "Starting PostgreSQL, Redis and MinIO with Docker"
    pnpm infra:up >/dev/null
    local i
    for ((i = 0; i < 60; i++)); do port_open "$port" "$host" && break; sleep 1; done
    port_open "$port" "$host" || die "PostgreSQL did not come up on $host:$port."
    ok "PostgreSQL is up"
    check_login
  else
    die "PostgreSQL is not answering on $host:$port, and Docker is not running. Start Docker and run again, or start your own PostgreSQL and set DATABASE_URL in .env."
  fi
}

check_redis() {
  local url host port
  url=$(env_get REDIS_URL redis://localhost:6379); host=$(host_of "$url"); port=$(port_of "$url")
  if port_open "$port" "$host"; then ok "Redis answers on $host:$port"; else warn "Redis is not answering on $host:$port. The API will report not-ready and the worker will not start."; fi
}

cmd_start() {
  SKIP_INFRA=0; WITH_WEB=1; DETACH=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --no-infra) SKIP_INFRA=1;;
      --no-web) WITH_WEB=0;;
      -d|--detach) DETACH=1;;
      *) die "unknown option: $1 (see the top of run.sh)";;
    esac
    shift
  done

  mkdir -p "$RUN_DIR"
  for name in $SERVICES; do
    if is_running "$name"; then die "$(svc_label "$name") is already running from a previous start. Run ./run.sh stop first."; fi
  done

  say "1/4 Checking tools"
  command -v node >/dev/null 2>&1 || die "Node.js is not installed (version 20.9 or newer is needed)."
  command -v pnpm >/dev/null 2>&1 || die "pnpm is not installed."
  command -v curl >/dev/null 2>&1 || die "curl is not installed."
  local major; major=$(node -p 'process.versions.node.split(".")[0]')
  [ "$major" -ge 20 ] || die "Node.js $(node -v) is too old; 20.9 or newer is needed."
  ok "node $(node -v), pnpm $(pnpm -v)"
  if [ ! -d node_modules ]; then say "Installing dependencies"; pnpm install; fi
  if [ ! -f .env ]; then
    pnpm env:init >/dev/null; ok "created .env with new secrets (edit it if your services run elsewhere)"
  elif [ -z "$(env_get SESSION_SECRET)" ] || [ -z "$(env_get INTERNAL_API_TOKEN)" ]; then
    pnpm env:init >/dev/null; ok ".env found; filled its blank secrets (nothing else was changed)"
  else
    ok ".env found"
  fi

  say "2/4 Infrastructure"
  ensure_infra
  check_redis

  say "3/4 Database"
  pnpm --filter @fact-lens/api migrate up >"$(log_file migrate)" 2>&1 || { head -n 6 "$(log_file migrate)" >&2; die "migrations failed. Full log: $(log_file migrate)"; }
  ok "migrations applied"
  pnpm --filter @fact-lens/api seed >"$(log_file seed)" 2>&1 || { head -n 6 "$(log_file seed)" >&2; die "seed failed. Full log: $(log_file seed)"; }
  ok "reference data seeded"

  say "4/4 Apps, one at a time"
  trap 'echo; say "Stopping"; stop_all; exit 0' INT TERM
  local name
  for name in $SERVICES; do
    [ "$name" = "web" ] && [ "$WITH_WEB" = "0" ] && continue
    start_service "$name"
  done

  echo
  say "Everything is running"
  echo "  Newsroom   $(env_get NEWSROOM_BASE_URL http://localhost:3100)   (sign in with the dev provider's user picker)"
  echo "  Public web http://localhost:3000"
  echo "  API        http://localhost:$(svc_port api)/health/ready"
  echo "  Worker     http://localhost:$(svc_port worker)/health"
  echo "  Logs       ./run.sh logs [idp|api|worker|newsroom|web]"
  if [ "$DETACH" = "1" ]; then
    trap - INT TERM
    echo "  Stop       ./run.sh stop"
    return 0
  fi
  echo "  Press Ctrl-C to stop everything."
  # Stay in the foreground; leave if any service dies so the failure is not hidden.
  while true; do
    for name in $SERVICES; do
      [ -f "$(pid_file "$name")" ] || continue
      if ! is_running "$name"; then
        warn "$(svc_label "$name") stopped on its own. Last log lines:"
        tail -n 20 "$(log_file "$name")" >&2 || true
        stop_all
        exit 1
      fi
    done
    sleep 2
  done
}

cmd_stop() {
  mkdir -p "$RUN_DIR"
  local any=0 name
  for name in $SERVICES; do [ -f "$(pid_file "$name")" ] && any=1; done
  if [ "$any" = "0" ]; then echo "Nothing to stop."; return 0; fi
  stop_all
}

cmd_status() {
  local name state
  for name in $SERVICES; do
    if is_running "$name"; then
      if curl -fs -o /dev/null --max-time 2 "$(svc_health "$name")" 2>/dev/null; then state="\033[32mrunning\033[0m, healthy"; else state="\033[33mrunning\033[0m, not answering yet"; fi
    else state="stopped"; fi
    printf '  %-22s ' "$(svc_label "$name")"; printf "$state"; printf '  port %s\n' "$(svc_port "$name")"
  done
}

cmd_logs() {
  mkdir -p "$RUN_DIR"
  if [ $# -gt 0 ]; then
    case " $SERVICES " in *" $1 "*) ;; *) die "unknown service: $1 (one of: $SERVICES)";; esac
    [ -f "$(log_file "$1")" ] || die "no log yet for $1"
    exec tail -n 100 -f "$(log_file "$1")"
  fi
  exec tail -n 20 -f $(for n in $SERVICES; do [ -f "$(log_file "$n")" ] && printf '%s ' "$(log_file "$n")"; done)
}

case "${1:-start}" in
  start) shift || true; cmd_start "$@";;
  -d|--detach|--no-infra|--no-web) cmd_start "$@";;   # options alone mean "start with these options"
  stop) cmd_stop;;
  status) cmd_status;;
  logs) shift; cmd_logs "$@";;
  -h|--help|help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//';;
  *) die "unknown command: $1 (start, stop, status, logs)";;
esac
