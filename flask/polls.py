"""In-memory poll store.

Data lives for as long as the server process does — it resets on every
restart or redeploy. No database, no env vars.

Gunicorn note: memory is per-process, so run a single worker (use
--threads for concurrency) or the store will disagree between workers.
"""

import secrets
import threading
from datetime import datetime, timezone

_lock = threading.Lock()
_polls: dict[str, dict] = {}


def _now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def create_poll(question: str, option_labels: list[str]) -> dict:
    poll = {
        "id": secrets.token_hex(4),
        "question": question,
        "options": [{"label": label, "votes": 0} for label in option_labels],
        "created_at": _now(),
    }
    with _lock:
        _polls[poll["id"]] = poll
    return poll


def list_polls() -> list[dict]:
    with _lock:
        return sorted(_polls.values(), key=lambda p: p["created_at"], reverse=True)


def get_poll(poll_id: str) -> dict | None:
    with _lock:
        return _polls.get(poll_id)


def vote(poll_id: str, option_index: int) -> dict | None:
    """Record a vote; returns the poll, or None if the index is out of range."""
    with _lock:
        poll = _polls.get(poll_id)
        if poll is None or not 0 <= option_index < len(poll["options"]):
            return None
        poll["options"][option_index]["votes"] += 1
        return poll


def delete_poll(poll_id: str) -> bool:
    with _lock:
        return _polls.pop(poll_id, None) is not None


# Two sample polls so the app isn't empty on first boot.
create_poll(
    "Pineapple on pizza?",
    ["Yes, fight me", "Absolutely not", "Only with bacon"],
)
create_poll(
    "Best deploy time?",
    ["Friday 5pm", "Monday morning", "Whenever CI is green"],
)
