const feed = document.getElementById("feed");
const connection = document.getElementById("connection");
const connectionLabel = document.getElementById("connection-label");
const form = document.getElementById("deploy-form");
const appInput = document.getElementById("app");

const MAX_ENTRIES = 50;
const LEVELS = new Set(["info", "success", "warn", "error"]);

function timeOf(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function render(event) {
  const item = document.createElement("article");
  item.className = `entry is-${LEVELS.has(event.level) ? event.level : "info"}`;

  const dot = document.createElement("span");
  dot.className = "dot";
  dot.setAttribute("aria-hidden", "true");
  const app = document.createElement("span");
  app.className = "app";
  app.textContent = event.app;
  const message = document.createElement("span");
  message.className = "message";
  message.textContent = event.message;
  const time = document.createElement("time");
  time.textContent = timeOf(event.timestamp);

  item.append(dot, app, message, time);
  feed.prepend(item);
  while (feed.children.length > MAX_ENTRIES) feed.lastChild.remove();
}

function connect() {
  // EventSource reconnects on its own; we only update the badge.
  const source = new EventSource("/events");
  source.onopen = () => {
    connection.dataset.state = "connected";
    connectionLabel.textContent = "Live";
  };
  source.onerror = () => {
    connection.dataset.state = "reconnecting";
    connectionLabel.textContent = "Reconnecting…";
  };
  source.onmessage = (message) => render(JSON.parse(message.data));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const app = appInput.value.trim();
  if (!app) return;
  try {
    await fetch("/deploys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app }),
    });
    appInput.value = "";
  } catch {
    // the connection badge already reports stream problems
  }
});

connect();
