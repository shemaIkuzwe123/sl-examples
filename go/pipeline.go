package main

import (
	"context"
	"fmt"
	"math/rand/v2"
	"sync"
	"time"
)

// Pipeline simulates CI/CD activity: deploys progress through stages in
// their own goroutines, and ambient background activity keeps the feed
// alive without user input.
type Pipeline struct {
	hub *Hub
	wg  sync.WaitGroup
}

func NewPipeline(hub *Hub) *Pipeline {
	return &Pipeline{hub: hub}
}

var ambientApps = []string{"web", "api", "worker", "docs", "admin"}

// StartAmbient emits background activity until ctx is cancelled.
func (p *Pipeline) StartAmbient(ctx context.Context) {
	p.wg.Add(1)
	go func() {
		defer p.wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Duration(2500+rand.IntN(3500)) * time.Millisecond):
				p.ambientEvent()
			}
		}
	}()
}

func (p *Pipeline) ambientEvent() {
	roll := rand.Float64()
	app := ambientApps[rand.IntN(len(ambientApps))]
	switch {
	case roll < 0.55:
		p.publish(app, "Health check passed", LevelSuccess)
	case roll < 0.70:
		p.publish(app, fmt.Sprintf("Health check slow — %d ms response time", 600+rand.IntN(600)), LevelWarn)
	case roll < 0.85:
		p.publish(app, fmt.Sprintf("Autoscaled from %d to %d instances", 1+rand.IntN(2), 3+rand.IntN(2)), LevelInfo)
	default:
		p.Deploy(app) // a teammate ships while you watch
	}
}

// Deploy runs a simulated deployment pipeline in a new goroutine.
func (p *Pipeline) Deploy(app string) {
	p.wg.Add(1)
	go func() {
		defer p.wg.Done()
		stages := []struct{ message, level string }{
			{"Deployment queued", LevelInfo},
			{"Building image", LevelInfo},
			{"Running smoke tests", LevelInfo},
			{"Releasing new version", LevelInfo},
			{"Deployment live", LevelSuccess},
		}
		// ~15% of deploys fail somewhere in the middle.
		failAt := -1
		if rand.Float64() < 0.15 {
			failAt = 1 + rand.IntN(3) // building, testing, or releasing
		}
		for i, stage := range stages {
			if i == failAt {
				p.publish(app, "Pipeline failed: "+failureReason(), LevelError)
				return
			}
			p.publish(app, stage.message, stage.level)
			time.Sleep(time.Duration(300+rand.IntN(500)) * time.Millisecond)
		}
	}()
}

func (p *Pipeline) publish(app, message, level string) {
	p.hub.Publish(Event{
		ID:        fmt.Sprint(time.Now().UnixNano()),
		App:       app,
		Message:   message,
		Level:     level,
		Timestamp: time.Now().UTC(),
	})
}

// Wait blocks until all pipeline goroutines have finished — used during
// graceful shutdown so nothing publishes after the server stops.
func (p *Pipeline) Wait() {
	p.wg.Wait()
}

func failureReason() string {
	reasons := []string{
		"tests failed",
		"image push rejected",
		"health check never turned green",
		"out of memory",
	}
	return reasons[rand.IntN(len(reasons))]
}
