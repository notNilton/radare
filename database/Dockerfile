FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
COPY coredb.go logdb.go migrator.go ./
COPY cmd ./cmd
COPY coredb_migrations ./coredb_migrations
COPY logdb_migrations  ./logdb_migrations
COPY coredb_seeds      ./coredb_seeds
COPY logdb_seeds       ./logdb_seeds

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o migrate ./cmd/migrate

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/migrate .

ENTRYPOINT ["./migrate"]
