FROM golang:1.25-alpine AS builder

WORKDIR /workspace

RUN apk add --no-cache ca-certificates tzdata git

COPY apps/backend/go.mod apps/backend/go.sum ./apps/backend/
COPY database/go.mod database/go.sum ./database/

WORKDIR /workspace/apps/backend
RUN go mod download

WORKDIR /workspace
COPY apps/backend ./apps/backend
COPY database ./database

WORKDIR /workspace/apps/backend
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/main ./cmd/api

WORKDIR /workspace/database
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/migrate ./cmd/migrate

FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

COPY --from=builder /out/main ./main
COPY --from=builder /out/migrate ./migrate
COPY apps/backend/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh ./migrate

EXPOSE 8080

CMD ["./entrypoint.sh"]
