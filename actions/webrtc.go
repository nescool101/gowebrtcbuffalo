package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections for development
	},
}

// WebRTCHandler handles WebRTC signaling
func WebRTCHandler(c buffalo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	// Simple message relay for signaling
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		// Broadcast the message to all other clients
		// In a real app, you'd want to manage rooms and peers
		if err := conn.WriteMessage(messageType, message); err != nil {
			break
		}
	}

	return nil
}
