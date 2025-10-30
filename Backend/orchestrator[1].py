"""
Minimal orchestrator to glue timer, camera checks, calendar and todo modules,
and to emit real-time events to frontend clients over Socket.IO.

Adapt function calls to match the actual function names in:
- calendar_manager.py
- todo_manager.py
- camera_utils.py
- flow_study_app.py
"""

import time
import threading
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit

# import existing modules (adjust imports if those modules expose classes/functions)
import calendar_manager
import todo_manager
import camera_utils
import flow_study_app

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Simple in-memory registry of running timers/sessions
running_sessions = {}  # session_id -> {thread, stop_event, meta}


def publish_event(event_name, payload):
    """
    Publish to all connected socket clients and optionally log.
    """
    socketio.emit(event_name, payload)
    print(f"[orchestrator] event {event_name} -> {payload}")


def camera_watch_loop(session_id, stop_event, check_interval=5):
    """
    Periodically run camera check while the timer/session is active.
    On failure emit 'camera:fail' and optionally mark session paused/failed.
    """
    while not stop_event.is_set():
        try:
            ok, details = camera_utils.camera_check(session_id)  # adapt to actual API
        except Exception as e:
            ok = False
            details = {"error": str(e)}

        if not ok:
            publish_event("camera:fail", {"session_id": session_id, "details": details})
            # optional: call flow_study_app.handle_camera_fail(session_id) or similar
        else:
            publish_event("camera:ok", {"session_id": session_id})

        stop_event.wait(check_interval)


@app.route("/api/timer/start", methods=["POST"])
def start_timer():
    """
    Start a study-timer/session.
    Expected JSON:
      {
        "session_id": "optional-string",
        "duration_seconds": 1500,
        "check_camera": true,
        "block_apps": true
      }
    """
    data = request.json or {}
    session_id = data.get("session_id", f"session-{int(time.time()*1000)}")
    duration = data.get("duration_seconds", 1500)
    check_camera = bool(data.get("check_camera", True))
    block_apps = bool(data.get("block_apps", True))

    # start the timer via existing flow_study_app methods (adapt names)
    # e.g., flow_study_app.start_session(session_id, duration)
    try:
        flow_study_app.start_session(session_id, duration)  # adapt to real API
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    # create a background thread for camera checks if requested
    stop_event = threading.Event()
    watch_thread = None
    if check_camera:
        watch_thread = threading.Thread(target=camera_watch_loop, args=(session_id, stop_event, 5), daemon=True)
        watch_thread.start()

    # schedule expiration callback in a thread (simplest approach)
    def expiration_worker(sid, dur, stop_evt):
        publish_event("timer:started", {"session_id": sid, "duration_seconds": dur})
        # wait for duration or stop
        completed = not stop_evt.wait(dur)
        if completed:
            # call existing expiration handler in flow_study_app
            try:
                flow_study_app.on_session_expire(sid)  # adapt to real API
            except Exception as e:
                print("on_session_expire error:", e)
            publish_event("timer:expired", {"session_id": sid})
            # trigger alarm via todo_manager/calendar_manager or flow_study_app as needed
            publish_event("alarm:triggered", {"session_id": sid, "reason": "timer_expired"})
        else:
            publish_event("timer:stopped", {"session_id": sid})

    expiry_thread = threading.Thread(target=expiration_worker, args=(session_id, duration, stop_event), daemon=True)
    expiry_thread.start()

    running_sessions[session_id] = {"thread": expiry_thread, "watch_thread": watch_thread, "stop_event": stop_event, "meta": data}

    # instruct frontend to block apps (frontend/Electron should perform the OS-specific blocking)
    if block_apps:
        publish_event("block:apps", {"session_id": session_id})

    return jsonify({"ok": True, "session_id": session_id}), 200


@app.route("/api/timer/stop", methods=["POST"])
def stop_timer():
    data = request.json or {}
    session_id = data.get("session_id")
    if not session_id or session_id not in running_sessions:
        return jsonify({"ok": False, "error": "session_id missing or not running"}), 400

    info = running_sessions[session_id]
    info["stop_event"].set()

    # instruct frontend to unblock apps
    publish_event("unblock:apps", {"session_id": session_id})

    # cleanup
    running_sessions.pop(session_id, None)
    return jsonify({"ok": True, "session_id": session_id}), 200


@app.route("/api/calendar/event", methods=["POST"])
def create_calendar_event():
    """
    Create calendar event using calendar_manager module. Expect event JSON:
      { "title": "...", "start_ts": 163..., "reminder_seconds": 60, ... }
    """
    event = request.json or {}
    try:
        created = calendar_manager.create_event(event)  # adapt to real API
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    # schedule reminders inside calendar_manager (if it doesn't, orchestrator must schedule)
    publish_event("calendar:event_created", {"event": created})
    return jsonify({"ok": True, "event": created}), 200


@socketio.on("connect")
def on_connect():
    emit("hello", {"msg": "connected to orchestrator"})


if __name__ == "__main__":
    # entry point when run directly
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)