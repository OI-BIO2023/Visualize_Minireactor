import importlib.util
import os
import sys
import types
import unittest
from pathlib import Path


class FakeDynamoResource:
    def Table(self, _name):
        return object()


sys.modules["boto3"] = types.SimpleNamespace(
    resource=lambda _service: FakeDynamoResource()
)
os.environ["TABLE_NAME"] = "test"

module_path = Path(__file__).with_name("lambda_function.py")
spec = importlib.util.spec_from_file_location("lambda_function", module_path)
lambda_function = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lambda_function)


class RoutingTest(unittest.TestCase):
    def test_ident_routing(self):
        cases = [
            ({}, "MI"),
            ({"ident": ""}, "MI"),
            ({"ident": None}, "MI"),
            ({"ident": []}, "MI"),
            ({"ident": "__route__"}, "MI"),
            ({"ident": "__route__MI"}, "MI"),
            ({"ident": "__route__LH"}, "LH"),
            ({"ident": "MI"}, "MI"),
            ({"ident": "LH"}, "LH"),
        ]

        for message, expected in cases:
            with self.subTest(message=message):
                item = lambda_function.build_item(
                    {**message, "ts": "2026-08-24T00:00:00"}
                )
                self.assertEqual(item["ident"], expected)
                self.assertEqual(item["pk"], f"DEVICE#{expected}")


if __name__ == "__main__":
    unittest.main()
