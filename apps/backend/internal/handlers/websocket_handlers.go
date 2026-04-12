package handlers

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
	"radare-datarecon/apps/backend/internal/hub"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // In production, refine this to allowed origins
	},
}

// HandleWebsocket upgrades the connection, registers it with the hub,
// and keeps it alive until the client disconnects.
func HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade to websocket", "error", err)
		return
	}
	defer conn.Close()

	hub.Default.Register(conn)
	defer hub.Default.Unregister(conn)

	slog.Info("New websocket client connected")

	// Drain inbound messages (ping/pong, close frames).
	// We only push from server → client, so reads are just for liveness.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			slog.Debug("Websocket client disconnected", "error", err)
			return
		}
	}
}
