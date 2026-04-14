SHELL := /bin/bash

COMPOSE ?= podman compose
COMPOSE_FILE ?= compose.local.yml
BACKEND_DIR ?= apps/backend
WEBAPP_DIR ?= apps/webapp

.DEFAULT_GOAL := help

.PHONY: help
help:
	@printf "Radare local workflow\n\n"
	@printf "Usage:\n"
	@printf "  make db             Start CoreDB + LogDB + Redis (recreate if needed)\n"
	@printf "  make db-bootstrap   Start DBs, run all migrations and seeds\n"
	@printf "  make backend        Start backend with air\n"
	@printf "  make webapp         Start webapp with npm run dev\n"
	@printf "  make dev            Start DBs, backend and webapp\n\n"
	@printf "Database helpers:\n"
	@printf "  make migrate        Run CoreDB migrations\n"
	@printf "  make seed           Run CoreDB seeds\n"
	@printf "  make migrate-log    Run LogDB migrations\n"
	@printf "  make seed-log       Run LogDB seeds\n"
	@printf "  make nuke-and-pave  Reset local DB volumes and reapply migrations/seeds\n"
	@printf "  make db-logs        Follow CoreDB logs\n"
	@printf "  make db-down        Stop all local compose services\n"
	@printf "  make status         Show local compose service status\n\n"
	@printf "Config overrides:\n"
	@printf "  COMPOSE='docker compose' make db\n"

.PHONY: db
db:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate db logdb redis mqtt influxdb

.PHONY: db-bootstrap
db-bootstrap:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build --force-recreate migrate migrate-log seed seed-log

.PHONY: migrate
migrate:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build migrate

.PHONY: seed
seed:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build seed

.PHONY: migrate-log
migrate-log:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build migrate-log

.PHONY: seed-log
seed-log:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build seed-log

.PHONY: nuke-and-pave
nuke-and-pave:
	RADARE_CONFIRM_NUKE=yes COMPOSE="$(COMPOSE)" COMPOSE_FILE="$(COMPOSE_FILE)" ./scripts/nuke-and-pave.sh

.PHONY: db-logs
db-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f db

.PHONY: db-down
db-down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

.PHONY: status
status:
	$(COMPOSE) -f $(COMPOSE_FILE) ps

.PHONY: backend
backend:
	cd $(BACKEND_DIR) && air

.PHONY: webapp
webapp:
	cd $(WEBAPP_DIR) && npm run dev

.PHONY: dev
dev: db
	+$(MAKE) -j2 backend webapp
