from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def load_batches(path: Path) -> pd.DataFrame:
    batches = json.loads(path.read_text(encoding="utf-8"))
    return pd.DataFrame(batches)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="CSV or JSON export with raw reactor data")
    parser.add_argument("--batches", required=True, help="reactor_batches.json")
    parser.add_argument("--output", required=True, help="Output CSV/Parquet path")
    args = parser.parse_args()

    input_path = Path(args.input)
    batches = load_batches(Path(args.batches))

    if input_path.suffix.lower() == ".json":
        df = pd.read_json(input_path)
    else:
        df = pd.read_csv(input_path)

    if "reactor" not in df.columns and "reactor" in batches.columns:
        df = df.merge(batches[["reactor", "fill_at", "empty_at"]], on="reactor", how="left")

    output_path = Path(args.output)
    if output_path.suffix.lower() == ".parquet":
        df.to_parquet(output_path, index=False)
    else:
        df.to_csv(output_path, index=False)


if __name__ == "__main__":
    main()
