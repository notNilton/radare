# Stage 1: Build the Go application
FROM golang:1.25-alpine AS builder

WORKDIR /workspace

# Copy go.mod and go.sum to download dependencies
COPY apps/backend/go.mod apps/backend/go.sum ./apps/backend/
COPY database/go.mod database/go.sum ./database/

WORKDIR /workspace/apps/backend
RUN go mod download

# Copy the rest of the application source code
WORKDIR /workspace
COPY apps/backend ./apps/backend
COPY database ./database

# Build the application
WORKDIR /workspace/apps/backend
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Stage 2: Create a minimal final image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the pre-built binary from the builder stage
COPY --from=builder /workspace/apps/backend/main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./main"]
