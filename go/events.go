package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Levels drive the feed's colors.
const (
	LevelInfo    = "info"
	LevelSuccess = "success"
	LevelWarn    = "warn"
	LevelError   = "error"
)

// Event is one line in the live feed.
type Event struct {
	ID        string    `json:"id"`
	App       string    `json:"app"`
	Message   string    `json:"message"`
	Level     string    `json:"level"`
	Timestamp time.Time `json:"timestamp"`
}

// writeSSE frames an event in the Server-Sent Events wire format
// (a `data:` line followed by a blank line).
func writeSSE(w http.ResponseWriter, e Event) error {
	data, err := json.Marshal(e)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(w, "data: %s\n\n", data)
	return err
}

// eventsHandler streams events as Server-Sent Events: recent history is
// replayed on connect, then new events are pushed as they happen. A
// heartbeat comment keeps intermediaries from timing the connection out.
func eventsHandler(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming unsupported", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		// Tell reverse proxies (nginx et al.) not to buffer the stream.
		w.Header().Set("X-Accel-Buffering", "no")

		for _, e := range hub.Recent(25) {
			if writeSSE(w, e) != nil {
				return
			}
		}
		flusher.Flush()

		ch, cancel := hub.Subscribe()
		defer cancel()

		heartbeat := time.NewTicker(15 * time.Second)
		defer heartbeat.Stop()

		for {
			select {
			case <-r.Context().Done():
				return
			case e := <-ch:
				if writeSSE(w, e) != nil {
					return
				}
				flusher.Flush()
			case <-heartbeat.C:
				if _, err := fmt.Fprint(w, ": ping\n\n"); err != nil {
					return
				}
				flusher.Flush()
			}
		}
	}
}
