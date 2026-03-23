"""
Seed the SQLite database with initial milestone data.
Run once after creating the database:  python seed.py
"""

import sys
from pathlib import Path

# Make sure app.py's module is importable
sys.path.insert(0, str(Path(__file__).parent))

from app import app, db, Milestone, Photo, Annotation, Comment

SEED_DATA = [
    {
        "id": "k1",
        "year": 1967,
        "title": "Kathy's Wedding",
        "date": "June 10, 1967",
        "description": "Kathy's wedding day — family and friends gathered.",
        "story": "Short story or memory text for Kathy's wedding.",
        "photos": [
            {
                "id": "kp1",
                "url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Kathy on her wedding day",
            },
            {
                "id": "kp2",
                "url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Reception moment",
            },
        ],
        "comments": [],
    },
    {
        "id": "1",
        "year": 1945,
        "title": "Birth of Dorothy",
        "date": "March 15, 1945",
        "description": "Dorothy was born in Springfield",
        "story": (
            "On a crisp spring morning in Springfield, Dorothy entered the world as the youngest of three children. "
            "Her parents, working-class immigrants, had built a modest but loving home where she would spend her "
            "formative years. The neighborhood was tight-knit, and everyone knew everyone else's business - "
            "in the best possible way."
        ),
        "photos": [
            {
                "id": "p1",
                "url": "https://images.unsplash.com/photo-1623670616473-3fc377ddaa22?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Baby Dorothy with her mother",
                "annotations": [],
            }
        ],
        "comments": [
            {
                "id": "c1",
                "author": "Susan (granddaughter)",
                "text": "I never knew Grandma was born in Springfield! This is such a treasure.",
                "date": "2024-01-15",
            }
        ],
    },
    {
        "id": "2",
        "year": 1948,
        "title": "Birth of Robert",
        "date": "July 22, 1948",
        "description": "Robert was born in nearby Riverside",
        "story": (
            "Robert came into the world during a particularly hot summer. His father was a factory worker, "
            "and his mother took care of the home and their four children. Robert was the third child, known "
            "even from a young age for his mischievous grin and adventurous spirit."
        ),
        "photos": [
            {
                "id": "p2",
                "url": "https://images.unsplash.com/photo-1696805122343-73c8f24c9196?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Young Robert",
            }
        ],
        "comments": [],
    },
    {
        "id": "3",
        "year": 1967,
        "title": "Dorothy & Robert's Wedding",
        "date": "June 10, 1967",
        "description": "They were married at St. Mary's Church",
        "story": (
            "After meeting at a community dance three years prior, Dorothy and Robert knew they had found their "
            "soulmates. Their wedding was a beautiful affair held at St. Mary's Church, attended by over 200 "
            "friends and family members. Dorothy wore her mother's wedding dress, altered to fit the modern style "
            "of the times. Robert wore his best suit, though he admitted later he was so nervous he couldn't "
            "remember the vows he'd practiced for weeks. The reception was held in the church basement, where "
            "they danced until midnight."
        ),
        "photos": [
            {
                "id": "p3",
                "url": "https://images.unsplash.com/photo-1709604795140-bd610490226a?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Wedding day at St. Mary's",
                "annotations": [
                    {
                        "id": "a1",
                        "x": 45,
                        "y": 30,
                        "text": "This is the dress Mom wore!",
                        "author": "Margaret",
                        "date": "2024-02-01",
                    }
                ],
            },
            {
                "id": "p4",
                "url": "https://images.unsplash.com/photo-1769618096619-834a3f28b807?w=1080&q=80&fit=max&fm=jpg",
                "caption": "Reception celebration",
            },
        ],
        "comments": [
            {
                "id": "c2",
                "author": "Michael (grandson)",
                "text": "What a beautiful wedding! I love seeing these old photos.",
                "date": "2024-02-10",
            },
            {
                "id": "c3",
                "author": "Jennifer (niece)",
                "text": "I remember Grandma telling me about dancing until midnight! She said her feet hurt for a week 😊",
                "date": "2024-02-12",
            },
        ],
    },
    {
        "id": "4",
        "year": 1970,
        "title": "First Home",
        "date": "April 1970",
        "description": "Purchased their first home on Maple Street",
        "story": (
            "After saving diligently for three years, Dorothy and Robert finally had enough for a down payment "
            "on a small house on Maple Street. It was a modest two-bedroom home with a small yard, but it was "
            "theirs. Robert spent weekends fixing it up, while Dorothy planted a garden that would become the "
            "envy of the neighborhood."
        ),
        "photos": [],
        "comments": [
            {
                "id": "c4",
                "author": "Tom (son)",
                "text": "I was born in this house! So many memories.",
                "date": "2024-03-05",
            }
        ],
    },
    {
        "id": "5",
        "year": 1992,
        "title": "50th Anniversary Celebration",
        "date": "June 10, 2017",
        "description": "Golden anniversary celebration with family",
        "story": (
            "The whole family gathered to celebrate Dorothy and Robert's 50th wedding anniversary. Children, "
            "grandchildren, and even a few great-grandchildren came from across the country. They renewed their "
            "vows in a touching ceremony, and Robert surprised Dorothy with a trip to Paris - something they'd "
            "always dreamed of but never thought possible."
        ),
        "photos": [
            {
                "id": "p5",
                "url": "https://images.unsplash.com/photo-1769618096619-834a3f28b807?w=1080&q=80&fit=max&fm=jpg",
                "caption": "The whole family together",
            }
        ],
        "comments": [
            {
                "id": "c5",
                "author": "Emily (granddaughter)",
                "text": "This was such a special day! I'll never forget seeing them renew their vows.",
                "date": "2024-01-20",
            }
        ],
    },
    {
        "id": "m-garyjr",
        "year": 2026,
        "title": "Gary Jr is gone",
        "date": "2026-02-24",
        "description": "In memory of Gary Jr.",
        "story": "Gary Jr is gone",
        "photos": [],
        "comments": [],
    },
]


def seed():
    with app.app_context():
        db.create_all()

        if Milestone.query.count() > 0:
            print("Database already has milestones — skipping seed. Delete scrapbook.db to reseed.")
            return

        for data in SEED_DATA:
            m = Milestone(
                id=data["id"],
                year=data["year"],
                title=data["title"],
                date=data.get("date", ""),
                description=data.get("description", ""),
                story=data.get("story", ""),
            )
            db.session.add(m)

            for i, pd in enumerate(data.get("photos", [])):
                photo = Photo(
                    id=pd["id"],
                    milestone_id=data["id"],
                    url=pd["url"],
                    caption=pd.get("caption", ""),
                    sort_order=i,
                )
                db.session.add(photo)
                for ad in pd.get("annotations", []):
                    ann = Annotation(
                        id=ad["id"],
                        photo_id=pd["id"],
                        x=ad["x"],
                        y=ad["y"],
                        text=ad["text"],
                        author=ad["author"],
                        date=ad["date"],
                    )
                    db.session.add(ann)

            from app import Comment as CommentModel
            for cd in data.get("comments", []):
                c = CommentModel(
                    id=cd["id"],
                    milestone_id=data["id"],
                    author=cd["author"],
                    text=cd["text"],
                    date=cd["date"],
                )
                db.session.add(c)

        db.session.commit()
        print(f"Seeded {len(SEED_DATA)} milestones.")


if __name__ == "__main__":
    seed()
