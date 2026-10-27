// Ship feed — a live deploy activity stream over Server-Sent Events.
// Standard library only: net/http pattern routing, slog logs, and the
// goroutine/channel machinery that makes Go what it is.
package main

import (
	"context"
	"embed"
	"encoding/json"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

//go:embed web
var webFS embed.FS

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	hub := NewHub()
	pipeline := NewPipeline(hub)
	pipeline.StartAmbient(ctx)

	webRoot, err := fs.Sub(webFS, "web")
	if err != nil {
		logger.Error("embedded web assets missing", "err", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /events", eventsHandler(hub))
	mux.HandleFunc("POST /deploys", triggerDeploy(pipeline))
	mux.Handle("GET /", http.FileServerFS(webRoot))

	port := envPort()
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: withLogging(logger, mux),
	}

	go func() {
		logger.Info("listening on http://0.0.0.0:" + port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "err", err)
			stop()
		}
	}()

	<-ctx.Done()
	logger.Info("shutdown signal received, draining connections")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
	}
	pipeline.Wait() // let in-flight pipelines finish publishing
	logger.Info("stopped")
}

// health is a probe target for the platform.
func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// triggerDeploy accepts {"app": "..."} and kicks off a simulated pipeline.
func triggerDeploy(p *Pipeline) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			App string `json:"app"`
		}
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields() // reject unexpected payload fields
		if err := decoder.Decode(&body); err != nil {
			writeError(w, http.StatusBadRequest, `body must be JSON with an "app" field`)
			return
		}
		app := strings.TrimSpace(body.App)
		if app == "" || len(app) > 40 {
			writeError(w, http.StatusBadRequest, "app is required (max 40 characters)")
			return
		}
		p.Deploy(app)
		writeJSON(w, http.StatusAccepted, map[string]bool{"queued": true})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"message": message})
}

func envPort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "3000"
}

// statusWriter remembers the status code so the logging middleware can
// report it.
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

// Flush passes through to the underlying writer so handlers can stream
// (e.g. Server-Sent Events) through the middleware.
func (w *statusWriter) Flush() {
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// withLogging logs method, path, status and duration — the morgan analog,
// zero dependencies.
func withLogging(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", sw.status,
			"duration", time.Since(start).Round(time.Millisecond),
		)
	})
}
