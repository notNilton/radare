FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY database.go ./
COPY cmd ./cmd
COPY migrations ./migrations
COPY seeds ./seeds

RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o migrate ./cmd/migrate

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/migrate ./migrate
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds

ENTRYPOINT ["./migrate"]
