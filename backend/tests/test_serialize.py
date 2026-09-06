import unittest
from datetime import datetime, timezone

from bson import ObjectId

from app.models.serialize import serialize_id
from app.services.tasks import next_growth


class SerializeTests(unittest.TestCase):
    def test_converts_objectid_and_datetime(self):
        oid = ObjectId()
        created = datetime(2026, 9, 6, tzinfo=timezone.utc)
        result = serialize_id({"_id": oid, "createdAt": created, "userIds": [oid]})
        self.assertEqual(result["id"], str(oid))
        self.assertEqual(result["createdAt"], created.isoformat())
        self.assertEqual(result["userIds"], [str(oid)])


class GrowthTests(unittest.TestCase):
    def test_caps_growth_at_100(self):
        self.assertEqual(next_growth(95, 10), 100)
        self.assertEqual(next_growth(0, 5), 5)


if __name__ == "__main__":
    unittest.main()
