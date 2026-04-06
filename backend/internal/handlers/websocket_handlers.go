package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // In production, refine this
	},
}

// HandleWebsocket manages real-time data streaming
func HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade to websocket", "error", err)
		return
	}
	defer conn.Close()

	slog.Info("New websocket client connected")

	// Ticker to send data every second
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			mutex.RLock()
			data := currentValues
			mutex.RUnlock()

			if err := conn.WriteJSON(data); err != nil {
				slog.Warn("Websocket client disconnected", "error", err)
				return
			}
		}
	}
}
