package main

import "sync"

// Hub broadcasts events to every connected SSE client and keeps a short
// replay buffer so new connections see recent activity immediately.
type Hub struct {
	mu      sync.Mutex
	clients map[chan Event]struct{}
	recent  []Event
}

const replaySize = 25

func NewHub() *Hub {
	return &Hub{clients: make(map[chan Event]struct{})}
}

// Subscribe registers a client. The returned func unregisters it.
func (h *Hub) Subscribe() (<-chan Event, func()) {
	ch := make(chan Event, 16)
	h.mu.Lock()
	h.clients[ch] = struct{}{}
	h.mu.Unlock()
	return ch, func() {
		h.mu.Lock()
		delete(h.clients, ch)
		close(ch)
		h.mu.Unlock()
	}
}

// Publish fans out to all clients and appends to the replay buffer.
// A slow client's buffer simply drops the event instead of blocking
// every other subscriber.
func (h *Hub) Publish(e Event) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.recent = append(h.recent, e)
	if len(h.recent) > replaySize {
		h.recent = h.recent[len(h.recent)-replaySize:]
	}
	for ch := range h.clients {
		select {
		case ch <- e:
		default:
		}
	}
}

// Recent returns the last n events, oldest first.
func (h *Hub) Recent(n int) []Event {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.recent) < n {
		n = len(h.recent)
	}
	out := make([]Event, n)
	copy(out, h.recent[len(h.recent)-n:])
	return out
}
