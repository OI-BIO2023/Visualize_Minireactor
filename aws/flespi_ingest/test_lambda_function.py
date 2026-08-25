import importlib.util
import os
import sys
import types
import unittest
from decimal import Decimal
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

    def test_complete_blank_ident_frame_is_a_heartbeat(self):
        message = {"ident": "", "ts": "2026-08-24T00:00:00", "K.T1": 31.9}
        item = lambda_function.build_item(message)
        self.assertTrue(lambda_function.is_hmi_heartbeat(message, item))

    def test_other_mi_values_do_not_mask_a_missing_measurement_frame(self):
        message = {"ident": "MI", "ts": "2026-08-24T00:00:00", "TF1": 35.8}
        item = lambda_function.build_item(message)
        self.assertFalse(lambda_function.is_hmi_heartbeat(message, item))

    def test_events_do_not_count_as_a_heartbeat(self):
        message = {"ident": "MI", "ts": "2026-08-24T00:00:00", "K.T1": 31.9, "alarm": True}
        item = lambda_function.build_item(message)
        self.assertEqual(item["type"], "event")
        self.assertFalse(lambda_function.is_hmi_heartbeat(message, item))

    def test_other_installations_do_not_count_as_a_heartbeat(self):
        message = {"ident": "LH", "ts": "2026-08-24T00:00:00", "K.T1": 31.9}
        item = lambda_function.build_item(message)
        self.assertFalse(lambda_function.is_hmi_heartbeat(message, item))

    def test_flespi_receive_time_is_used_for_the_heartbeat(self):
        message = {"timestamp": Decimal("1787578761.306232")}
        self.assertEqual(
            lambda_function.heartbeat_observed_at(message),
            "2026-08-24T13:39:21.306232Z",
        )


if __name__ == "__main__":
    unittest.main()
