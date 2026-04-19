import os
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = Path(__file__).parent

# On Render: set MEDIA_ROOT=/data/media and DB_PATH=/data/scrapbook.db
# (mount Persistent Disk at /data in the Render dashboard)
MEDIA_DIR   = Path(os.environ.get("MEDIA_ROOT",  str(BASE_DIR / "media")))
PHOTOS_DIR  = MEDIA_DIR / "photos"
AUDIO_DIR   = MEDIA_DIR / "audio"
INTAKE_DIR  = Path(os.environ.get("INTAKE_ROOT", str(MEDIA_DIR / "temp")))
DB_PATH     = os.environ.get("DB_PATH", str(BASE_DIR / "scrapbook.db"))

PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
INTAKE_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024  # 200 MB upload limit

db = SQLAlchemy(app)


# ── Models ────────────────────────────────────────────────────────────────────

class Milestone(db.Model):
    __tablename__ = "milestones"
    id          = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    year        = db.Column(db.Integer, nullable=False)
    title       = db.Column(db.String, nullable=False)
    date        = db.Column(db.String, default="")
    description = db.Column(db.Text, default="")
    story       = db.Column(db.Text, default="")
    video_url   = db.Column(db.String)

    photos      = db.relationship("Photo",     backref="milestone", cascade="all, delete-orphan", order_by="Photo.sort_order")
    comments    = db.relationship("Comment",   backref="milestone", cascade="all, delete-orphan", order_by="Comment.date")
    audio_clips = db.relationship("AudioClip", backref="milestone", cascade="all, delete-orphan", order_by="AudioClip.date")

    def to_dict(self):
        return {
            "id":          self.id,
            "year":        self.year,
            "title":       self.title,
            "date":        self.date,
            "description": self.description,
            "story":       self.story,
            "videoUrl":    self.video_url,
            "photos":      [p.to_dict() for p in self.photos],
            "comments":    [c.to_dict() for c in self.comments],
            "audioClips":  [a.to_dict() for a in self.audio_clips],
        }


class Photo(db.Model):
    __tablename__ = "photos"
    id           = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    milestone_id = db.Column(db.String, db.ForeignKey("milestones.id"), nullable=False)
    # External URL stored as-is; locally uploaded files stored as 'local:<filename>'
    url          = db.Column(db.String, nullable=False)
    caption      = db.Column(db.String, default="")
    sort_order   = db.Column(db.Integer, default=0)

    annotations  = db.relationship("Annotation", backref="photo", cascade="all, delete-orphan")

    def resolve_url(self):
        if self.url.startswith("local:"):
            return f"{request.host_url}media/photos/{self.url[6:]}"
        return self.url

    def to_dict(self):
        return {
            "id":          self.id,
            "url":         self.resolve_url(),
            "caption":     self.caption,
            "annotations": [a.to_dict() for a in self.annotations],
        }


class Annotation(db.Model):
    __tablename__ = "annotations"
    id       = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    photo_id = db.Column(db.String, db.ForeignKey("photos.id"), nullable=False)
    x        = db.Column(db.Float, nullable=False)
    y        = db.Column(db.Float, nullable=False)
    text     = db.Column(db.Text, nullable=False)
    author   = db.Column(db.String, nullable=False)
    date     = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {"id": self.id, "x": self.x, "y": self.y,
                "text": self.text, "author": self.author, "date": self.date}


class Comment(db.Model):
    __tablename__ = "comments"
    id           = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    milestone_id = db.Column(db.String, db.ForeignKey("milestones.id"), nullable=False)
    author       = db.Column(db.String, nullable=False)
    text         = db.Column(db.Text, nullable=False)
    date         = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {"id": self.id, "author": self.author, "text": self.text, "date": self.date}


class AudioClip(db.Model):
    __tablename__ = "audio_clips"
    id           = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    milestone_id = db.Column(db.String, db.ForeignKey("milestones.id"), nullable=False)
    filename     = db.Column(db.String, nullable=False)
    date         = db.Column(db.String, nullable=False)
    label        = db.Column(db.String)

    def to_dict(self):
        url = f"{request.host_url}media/audio/{self.filename}"
        return {"id": self.id, "url": url, "date": self.date, "label": self.label}


class PhotoIntakeNote(db.Model):
    __tablename__ = "photo_intake_notes"
    filename   = db.Column(db.String, primary_key=True)
    year       = db.Column(db.String, default="")
    notes      = db.Column(db.Text, default="")
    updated_at = db.Column(db.String, default="")

    def to_dict(self):
        return {
            "filename": self.filename,
            "year": self.year or "",
            "notes": self.notes or "",
            "updatedAt": self.updated_at or "",
            "url": f"{request.host_url}media/temp/{self.filename}",
        }


# ── Media serving ─────────────────────────────────────────────────────────────

@app.get("/media/photos/<path:filename>")
def serve_photo(filename):
    return send_from_directory(PHOTOS_DIR, filename)

@app.get("/media/audio/<path:filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename)

@app.get("/media/temp/<path:filename>")
def serve_temp_photo(filename):
    return send_from_directory(INTAKE_DIR, filename)


# ── Milestone routes ───────────────────────────────────────────────────────────

@app.get("/api/milestones")
def list_milestones():
    ms = Milestone.query.order_by(Milestone.year).all()
    return jsonify([m.to_dict() for m in ms])

@app.get("/api/milestones/<string:mid>")
def get_milestone(mid):
    m = db.get_or_404(Milestone, mid)
    return jsonify(m.to_dict())

@app.post("/api/milestones")
def create_milestone():
    data = request.json or {}
    m = Milestone(
        id=str(uuid.uuid4()),
        year=int(data.get("year", datetime.now().year)),
        title=data.get("title", "Untitled"),
        date=data.get("date", ""),
        description=data.get("description", ""),
        story=data.get("story", ""),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201

@app.patch("/api/milestones/<string:mid>")
def update_milestone(mid):
    m = db.get_or_404(Milestone, mid)
    data = request.get_json(silent=True) or {}
    if "title" in data:       m.title       = data["title"]
    if "year" in data:        m.year        = int(data["year"])
    if "date" in data:        m.date        = data["date"]
    if "description" in data: m.description = data["description"]
    if "story" in data:       m.story       = data["story"]
    db.session.commit()
    return jsonify(m.to_dict())

@app.delete("/api/milestones/<string:mid>")
def delete_milestone(mid):
    m = db.get_or_404(Milestone, mid)
    for p in m.photos:
        if p.url.startswith("local:"):
            (PHOTOS_DIR / p.url[6:]).unlink(missing_ok=True)
    for a in m.audio_clips:
        (AUDIO_DIR / a.filename).unlink(missing_ok=True)
    db.session.delete(m)
    db.session.commit()
    return "", 204


# ── Photo routes ───────────────────────────────────────────────────────────────

@app.post("/api/milestones/<string:mid>/photos")
def upload_photo(mid):
    m = db.get_or_404(Milestone, mid)
    caption    = request.form.get("caption", "")
    sort_order = int(request.form.get("sort_order", len(m.photos)))

    if "file" in request.files:
        f = request.files["file"]
        ext      = Path(f.filename).suffix if f.filename else ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        f.save(PHOTOS_DIR / filename)
        url = f"local:{filename}"
    else:
        url = request.form.get("url", "")
        if not url:
            return jsonify({"error": "No file or url provided"}), 400

    photo = Photo(milestone_id=mid, url=url, caption=caption, sort_order=sort_order)
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201

@app.delete("/api/milestones/<string:mid>/photos/<string:pid>")
def delete_photo(mid, pid):
    photo = db.get_or_404(Photo, pid)
    if photo.url.startswith("local:"):
        (PHOTOS_DIR / photo.url[6:]).unlink(missing_ok=True)
    db.session.delete(photo)
    db.session.commit()
    return "", 204


# ── Annotation routes ──────────────────────────────────────────────────────────

@app.post("/api/milestones/<string:mid>/photos/<string:pid>/annotations")
def add_annotation(mid, pid):
    data = request.json or {}
    a = Annotation(
        photo_id=pid,
        x=float(data["x"]),
        y=float(data["y"]),
        text=data["text"],
        author=data["author"],
        date=datetime.now().strftime("%Y-%m-%d"),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


# ── Comment routes ─────────────────────────────────────────────────────────────

@app.post("/api/milestones/<string:mid>/comments")
def add_comment(mid):
    db.get_or_404(Milestone, mid)
    data = request.json or {}
    c = Comment(
        milestone_id=mid,
        author=data["author"],
        text=data["text"],
        date=datetime.now().strftime("%Y-%m-%d"),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201


@app.delete("/api/milestones/<string:mid>/comments/<string:cid>")
def delete_comment(mid, cid):
    c = db.get_or_404(Comment, cid)
    db.session.delete(c)
    db.session.commit()
    return "", 204


# ── Audio routes ───────────────────────────────────────────────────────────────

@app.post("/api/milestones/<string:mid>/audio")
def upload_audio(mid):
    db.get_or_404(Milestone, mid)
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file provided"}), 400
    ext      = Path(f.filename).suffix if f.filename else ".webm"
    filename = f"{uuid.uuid4()}{ext}"
    f.save(AUDIO_DIR / filename)
    clip = AudioClip(
        milestone_id=mid,
        filename=filename,
        date=datetime.now().strftime("%Y-%m-%d"),
        label=request.form.get("label"),
    )
    db.session.add(clip)
    db.session.commit()
    return jsonify(clip.to_dict()), 201

@app.delete("/api/milestones/<string:mid>/audio/<string:cid>")
def delete_audio(mid, cid):
    clip = db.get_or_404(AudioClip, cid)
    (AUDIO_DIR / clip.filename).unlink(missing_ok=True)
    db.session.delete(clip)
    db.session.commit()
    return "", 204


# ── Photo intake routes ───────────────────────────────────────────────────────

def _photo_file_list():
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    files = []
    for item in sorted(INTAKE_DIR.iterdir(), key=lambda p: p.name.lower()):
        if item.is_file() and item.suffix.lower() in allowed:
            files.append(item.name)
    return files


@app.get("/api/photo-intake")
def list_photo_intake_entries():
    notes = {
        n.filename: n
        for n in PhotoIntakeNote.query.all()
    }

    payload = []
    for filename in _photo_file_list():
        note = notes.get(filename)
        if note:
            payload.append(note.to_dict())
        else:
            payload.append({
                "filename": filename,
                "url": f"{request.host_url}media/temp/{filename}",
                "year": "",
                "notes": "",
                "updatedAt": "",
            })
    return jsonify(payload)


@app.post("/api/photo-intake/<path:filename>")
def save_photo_intake_entry(filename):
    safe_filename = Path(filename).name
    if not safe_filename:
        abort(400)

    if not (INTAKE_DIR / safe_filename).exists():
        abort(404)

    data = request.get_json(silent=True) or {}
    year = str(data.get("year", "")).strip()
    notes = str(data.get("notes", "")).strip()

    entry = db.session.get(PhotoIntakeNote, safe_filename)
    if not entry:
        entry = PhotoIntakeNote(filename=safe_filename)
        db.session.add(entry)

    entry.year = year
    entry.notes = notes
    entry.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.session.commit()
    return jsonify(entry.to_dict())


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
