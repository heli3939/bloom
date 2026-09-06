from app.database import species_col, tasks_col

DEFAULT_SPECIES = {
    "name": "Bloom Tree",
    "description": "A shared tree that grows when both friends complete activities together.",
    "imageUrl": "",
}

DEFAULT_TASKS = [
    {
        "title": "Phone-free hangout",
        "description": "Spend some uninterrupted time together without your phones.",
        "category": "together",
        "growthValue": 100,
    },
    {
        "title": "Take a walk together",
        "description": "Go outside and take a short walk together.",
        "category": "together",
        "growthValue": 10,
    },
    {
        "title": "Share a snack or drink",
        "description": "Choose something simple and enjoy it together.",
        "category": "together",
        "growthValue": 5,
    },
    {
        "title": "Find something beautiful together",
        "description": "Notice and share something beautiful around you.",
        "category": "together",
        "growthValue": 5,
    },
    {
        "title": "Share a favourite song",
        "description": "Play a song you love and explain why you chose it.",
        "category": "together",
        "growthValue": 10,
    },
]


def seed_catalog() -> None:
    if species_col().count_documents({}) == 0:
        species_col().insert_one(DEFAULT_SPECIES)
    if tasks_col().count_documents({}) == 0:
        tasks_col().insert_many(DEFAULT_TASKS)
