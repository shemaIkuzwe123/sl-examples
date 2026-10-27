"""Polls — create polls, vote once, watch results.

Classic Flask surface: Jinja2 templates, flash messages, signed-cookie
sessions, form handling. In-memory store, no database.

Production (single worker: the store is per-process — see polls.py):

    gunicorn -b 0.0.0.0:$PORT -w 1 --threads 4 --access-logfile - app:app
"""

import os

from flask import (
    Flask,
    abort,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

import polls

app = Flask(__name__)
# Must be identical across every worker and stable across restarts — set
# SECRET_KEY in production. The fallback only exists for local runs.
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-insecure-key")

QUESTION_MAX = 200
OPTION_MAX = 80
MAX_OPTIONS = 6


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def index():
    return render_template("index.html", all_polls=polls.list_polls())


@app.post("/polls")
def create_poll():
    question = request.form.get("question", "").strip()
    options = [
        line.strip()
        for line in request.form.get("options", "").splitlines()
        if line.strip()
    ]

    error = None
    if not question or len(question) > QUESTION_MAX:
        error = f"Question is required (max {QUESTION_MAX} characters)."
    elif len(options) < 2:
        error = "Provide at least two options, one per line."
    elif len(options) > MAX_OPTIONS:
        error = f"At most {MAX_OPTIONS} options."
    elif any(len(option) > OPTION_MAX for option in options):
        error = f"Options must be at most {OPTION_MAX} characters."

    if error:
        flash(error, "error")
        return redirect(url_for("index"))

    poll = polls.create_poll(question, options)
    flash("Poll created. Share the link and watch the votes come in.")
    return redirect(url_for("show_poll", poll_id=poll["id"]))


@app.get("/polls/<poll_id>")
def show_poll(poll_id):
    poll = polls.get_poll(poll_id)
    if poll is None:
        abort(404)
    voted = session.get(f"voted:{poll_id}")
    return render_template("poll.html", poll=poll, voted=voted)


@app.post("/polls/<poll_id>/vote")
def vote(poll_id):
    poll = polls.get_poll(poll_id)
    if poll is None:
        abort(404)
    if f"voted:{poll_id}" in session:
        flash("You already voted in this poll.", "error")
        return redirect(url_for("show_poll", poll_id=poll_id))

    try:
        option_index = int(request.form["option"])
    except (KeyError, ValueError):
        abort(400)

    if polls.vote(poll_id, option_index) is None:
        abort(400)

    session[f"voted:{poll_id}"] = option_index
    flash("Vote recorded.")
    return redirect(url_for("show_poll", poll_id=poll_id))


@app.post("/polls/<poll_id>/delete")
def delete_poll(poll_id):
    if not polls.delete_poll(poll_id):
        abort(404)
    session.pop(f"voted:{poll_id}", None)
    flash("Poll deleted.")
    return redirect(url_for("index"))


@app.errorhandler(404)
def not_found(_error):
    return render_template("404.html"), 404
