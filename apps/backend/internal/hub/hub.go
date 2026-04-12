// Package hub implements a fan-out WebSocket notification hub.
// Any goroutine can call Broadcast to push a JSON message to every
// connected browser client without holding locks on the caller's side.
package hub

import (
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/gorilla/websocket"
)

// NotificationType classifies the purpose of a server-push message.
type NotificationType string

const (
	// TypeReconciliationResult is sent after every reconciliation,
	// carrying the status and key stats.
	TypeReconciliationResult NotificationType = "reconciliation.result"
	// TypeReconciliationError is sent when reconciliation processing fails.
	TypeReconciliationError NotificationType = "reconciliation.error"
	// TypeConnectorStatus reports a change in connector health.
	TypeConnectorStatus NotificationType = "connector.status"
	// TypeIngestValue notifies that a new tag value entered the cache.
	TypeIngestValue NotificationType = "ingest.value"
)

// Message is the envelope sent to every connected client.
type Message struct {
	Type    NotificationType `json:"type"`
	Payload any              `json:"payload"`
}

// Hub maintains the set of active WebSocket clients and
// broadcasts messages to all of them.
type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]struct{}
	send    chan []byte
	done    chan struct{}
}

// Default is the process-wide singleton hub.
var Default = New()

// New creates and starts a Hub. The hub's run loop is started in a
// background goroutine and lives for the duration of the process.
func New() *Hub {
	h := &Hub{
		clients: make(map[*websocket.Conn]struct{}),
		send:    make(chan []byte, 256),
		done:    make(chan struct{}),
	}
	go h.run()
	return h
}

// Register adds a WebSocket connection to the hub.
func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	h.clients[conn] = struct{}{}
	h.mu.Unlock()
	slog.Debug("WS hub: client registered", "total", h.clientCount())
}

// Unregister removes a connection from the hub without closing it
// (the caller is responsible for closing).
func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
	slog.Debug("WS hub: client unregistered", "total", h.clientCount())
}

// Broadcast enqueues a structured message for delivery to all clients.
// Non-blocking: if the send buffer is full the message is dropped.
func (h *Hub) Broadcast(msgType NotificationType, payload any) {
	msg := Message{Type: msgType, Payload: payload}
	data, err := json.Marshal(msg)
	if err != nil {
		slog.Warn("Hub: failed to marshal notification", "error", err)
		return
	}
	select {
	case h.send <- data:
	default:
		slog.Warn("Hub: send buffer full, dropping notification", "type", msgType)
	}
}

func (h *Hub) run() {
	for data := range h.send {
		h.mu.RLock()
		for conn := range h.clients {
			if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
				// Broken connections will be cleaned up by their own handlers.
				slog.Debug("WS hub: write error", "error", err)
			}
		}
		h.mu.RUnlock()
	}
}

func (h *Hub) clientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
