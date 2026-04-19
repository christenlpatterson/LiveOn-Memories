#!/usr/bin/env python3
import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def _now_stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def _read_json(url: str) -> list[dict]:
    req = Request(url, headers={"User-Agent": "LiveOnSync/1.0"})
    with urlopen(req, timeout=30) as res:
        data = res.read().decode("utf-8")
    return json.loads(data)


def _download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = Request(url, headers={"User-Agent": "LiveOnSync/1.0"})
    with urlopen(req, timeout=60) as res, dest.open("wb") as out:
        shutil.copyfileobj(res, out)


def _extract_media_filename(url: str, marker: str) -> str | None:
    path = urlsplit(url).path
    if marker not in path:
        return None
    raw = path.split(marker, 1)[1].strip("/")
    if not raw:
        return None
    return Path(raw).name


def _safe_rmtree_contents(path: Path) -> None:
    if not path.exists():
        return
    for child in path.iterdir():
        if child.is_file() or child.is_symlink():
            child.unlink(missing_ok=True)
        elif child.is_dir():
            shutil.rmtree(child)


def export_bundle(api_base: str, bundle_dir: Path) -> None:
    api_base = api_base.rstrip("/")
    milestones_url = f"{api_base}/api/milestones"
    print(f"Fetching milestones from {milestones_url}")
    milestones = _read_json(milestones_url)

    photos_dir = bundle_dir / "media" / "photos"
    audio_dir = bundle_dir / "media" / "audio"
    photos_dir.mkdir(parents=True, exist_ok=True)
    audio_dir.mkdir(parents=True, exist_ok=True)

    downloaded = {"photos": 0, "audio": 0}
    failed: list[str] = []

    for m in milestones:
        for p in m.get("photos", []):
            url = p.get("url", "")
            filename = _extract_media_filename(url, "/media/photos/")
            if not filename:
                continue
            dest = photos_dir / filename
            if dest.exists():
                continue
            try:
                _download_file(url, dest)
                downloaded["photos"] += 1
            except Exception as exc:  # noqa: BLE001
                failed.append(f"photo {url} -> {exc}")

        for clip in m.get("audioClips", []):
            url = clip.get("url", "")
            filename = _extract_media_filename(url, "/media/audio/")
            if not filename:
                continue
            dest = audio_dir / filename
            if dest.exists():
                continue
            try:
                _download_file(url, dest)
                downloaded["audio"] += 1
            except Exception as exc:  # noqa: BLE001
                failed.append(f"audio {url} -> {exc}")

    payload = {
        "exportedAt": datetime.now().isoformat(timespec="seconds"),
        "apiBase": api_base,
        "milestones": milestones,
    }
    bundle_dir.mkdir(parents=True, exist_ok=True)
    (bundle_dir / "bundle.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )

    print(f"Bundle written to {bundle_dir}")
    print(f"Downloaded photos: {downloaded['photos']}, audio: {downloaded['audio']}")
    if failed:
        print("Media download warnings:")
        for item in failed:
            print(f"  - {item}")


def hydrate_bundle(bundle_dir: Path, reset: bool = False) -> None:
    from app import (  # pylint: disable=import-outside-toplevel
        AUDIO_DIR,
        PHOTOS_DIR,
        Annotation,
        AudioClip,
        Comment,
        Milestone,
        Photo,
        app,
        db,
    )

    bundle_file = bundle_dir / "bundle.json"
    if not bundle_file.exists():
        raise FileNotFoundError(f"Bundle file not found: {bundle_file}")

    payload = json.loads(bundle_file.read_text(encoding="utf-8"))
    milestones = payload.get("milestones", [])
    src_photos = bundle_dir / "media" / "photos"
    src_audio = bundle_dir / "media" / "audio"

    with app.app_context():
        db.create_all()

        if reset:
            print("Resetting local content before hydrate...")
            db.session.query(Annotation).delete()
            db.session.query(Comment).delete()
            db.session.query(AudioClip).delete()
            db.session.query(Photo).delete()
            db.session.query(Milestone).delete()
            db.session.commit()
            _safe_rmtree_contents(PHOTOS_DIR)
            _safe_rmtree_contents(AUDIO_DIR)

        created = {"milestones": 0, "photos": 0, "audio": 0, "comments": 0, "annotations": 0}

        for m in milestones:
            mid = m.get("id")
            if mid and db.session.get(Milestone, mid):
                if not reset:
                    continue

            milestone = Milestone(
                id=mid,
                year=int(m.get("year", datetime.now().year)),
                title=m.get("title", "Untitled"),
                date=m.get("date", ""),
                description=m.get("description", ""),
                story=m.get("story", ""),
                video_url=m.get("videoUrl"),
            )
            db.session.add(milestone)
            db.session.flush()
            created["milestones"] += 1

            for idx, p in enumerate(m.get("photos", [])):
                source_url = p.get("url", "")
                filename = _extract_media_filename(source_url, "/media/photos/")
                stored_url = source_url
                if filename:
                    src = src_photos / filename
                    if src.exists():
                        dst = PHOTOS_DIR / filename
                        dst.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src, dst)
                        stored_url = f"local:{filename}"

                photo = Photo(
                    id=p.get("id"),
                    milestone_id=milestone.id,
                    url=stored_url,
                    caption=p.get("caption", ""),
                    sort_order=idx,
                )
                db.session.add(photo)
                db.session.flush()
                created["photos"] += 1

                for a in p.get("annotations", []):
                    ann = Annotation(
                        id=a.get("id"),
                        photo_id=photo.id,
                        x=float(a.get("x", 0)),
                        y=float(a.get("y", 0)),
                        text=a.get("text", ""),
                        author=a.get("author", "Unknown"),
                        date=a.get("date", ""),
                    )
                    db.session.add(ann)
                    created["annotations"] += 1

            for c in m.get("comments", []):
                comment = Comment(
                    id=c.get("id"),
                    milestone_id=milestone.id,
                    author=c.get("author", "Unknown"),
                    text=c.get("text", ""),
                    date=c.get("date", ""),
                )
                db.session.add(comment)
                created["comments"] += 1

            for clip in m.get("audioClips", []):
                source_url = clip.get("url", "")
                filename = _extract_media_filename(source_url, "/media/audio/")
                if not filename:
                    continue
                src = src_audio / filename
                if src.exists():
                    dst = AUDIO_DIR / filename
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
                audio = AudioClip(
                    id=clip.get("id"),
                    milestone_id=milestone.id,
                    filename=filename,
                    date=clip.get("date", ""),
                    label=clip.get("label"),
                )
                db.session.add(audio)
                created["audio"] += 1

        db.session.commit()

    print(
        "Hydrate complete: "
        f"milestones={created['milestones']}, "
        f"photos={created['photos']}, "
        f"annotations={created['annotations']}, "
        f"comments={created['comments']}, "
        f"audio={created['audio']}"
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Export production content bundle and hydrate local backend content.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    export_p = sub.add_parser("export", help="Export from production API into a bundle directory")
    export_p.add_argument("--api-base", required=True, help="Production backend origin, e.g. https://your-app.onrender.com")
    export_p.add_argument("--bundle", default=f"backups/bundle-{_now_stamp()}", help="Bundle output directory")

    hydrate_p = sub.add_parser("hydrate", help="Hydrate local backend from a bundle directory")
    hydrate_p.add_argument("--bundle", required=True, help="Path to existing bundle directory")
    hydrate_p.add_argument("--reset", action="store_true", help="Delete local DB content and media before import")

    pull_p = sub.add_parser("pull", help="Export from production and then hydrate local")
    pull_p.add_argument("--api-base", required=True, help="Production backend origin, e.g. https://your-app.onrender.com")
    pull_p.add_argument("--bundle", default=f"backups/bundle-{_now_stamp()}", help="Bundle directory")
    pull_p.add_argument("--reset", action="store_true", help="Delete local DB content and media before hydrate")
    pull_p.add_argument("--skip-hydrate", action="store_true", help="Only export; do not import into local backend")

    return parser


def main(argv: list[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    bundle_dir = Path(args.bundle).expanduser().resolve()

    if args.command == "export":
        export_bundle(args.api_base, bundle_dir)
        return 0

    if args.command == "hydrate":
        hydrate_bundle(bundle_dir, reset=args.reset)
        return 0

    if args.command == "pull":
        export_bundle(args.api_base, bundle_dir)
        if not args.skip_hydrate:
            hydrate_bundle(bundle_dir, reset=args.reset)
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
