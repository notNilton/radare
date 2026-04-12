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
	@printf "  make db             Start local Postgres\n"
	@printf "  make db-bootstrap   Start Postgres, run migrations and seeds\n"
	@printf "  make backend        Start backend with air\n"
	@printf "  make webapp         Start webapp with npm run dev\n"
	@printf "  make dev            Start Postgres, backend and webapp\n\n"
	@printf "Database helpers:\n"
	@printf "  make migrate        Run database migrations\n"
	@printf "  make seed           Run database seeds\n"
	@printf "  make db-logs        Follow database logs\n"
	@printf "  make db-down        Stop local compose services\n"
	@printf "  make status         Show local compose service status\n\n"
	@printf "Config overrides:\n"
	@printf "  COMPOSE='docker compose' make db\n"

.PHONY: db
db:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d db

.PHONY: db-bootstrap
db-bootstrap:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build seed

.PHONY: migrate
migrate:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build migrate

.PHONY: seed
seed:
	$(COMPOSE) -f $(COMPOSE_FILE) up --build seed

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
