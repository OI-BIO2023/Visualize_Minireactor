from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from features import add_time_features, select_feature_columns


def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        hours = pd.date_range("2026-07-01", periods=240, freq="h", tz="UTC")
        frame = pd.DataFrame(
            {
                "timestamp": hours,
                "batch_id": ["demo-batch"] * len(hours),
                "fill_at": [hours[0]] * len(hours),
                "T_Umgebung": 22 + np.sin(np.linspace(0, 6, len(hours))),
                "T_AER": 26 + np.sin(np.linspace(0, 5, len(hours))) * 0.5,
                "T_FW": 18 + np.cos(np.linspace(0, 4, len(hours))) * 0.2,
                "T_VL_global": 33 + np.sin(np.linspace(0, 3, len(hours))) * 0.8,
                "T_Speicher_oben": 60 + np.sin(np.linspace(0, 7, len(hours))) * 1.1,
                "T_Speicher_unten": 52 + np.sin(np.linspace(0, 7, len(hours))) * 1.0,
                "Q_IRR_Rx": (np.arange(len(hours)) % 12 < 3).astype(float),
                "T_IRR_Rx": 19 + np.sin(np.linspace(0, 8, len(hours))) * 0.3,
                "Vol_watering_Rx": np.linspace(0, 500, len(hours)),
                "Vol_watering_Rx_fw": np.linspace(0, 120, len(hours)),
                "V1_3_V_AER": 1,
                "V1_1_V_VL": (np.arange(len(hours)) % 10 < 6).astype(int),
                "T_RL_Rx": 34 + np.sin(np.linspace(0, 4, len(hours))) * 0.4,
                "T_VL_Rx": 30 + np.sin(np.linspace(0, 4, len(hours))) * 0.3,
                "P_heat_extraction_kW": 2.5 + np.sin(np.linspace(0, 6, len(hours))) * 0.2,
                "HUM_oben_Rx": 70 - np.linspace(0, 20, len(hours)) * 0.1,
                "HUM_unten_Rx": 66 - np.linspace(0, 16, len(hours)) * 0.1,
                "hours_since_fill": np.linspace(0, 239, len(hours)),
                "day_of_week": hours.dayofweek,
                "hour_of_day": hours.hour,
            }
        )
        frame["T_Mittel_Rx"] = 0.4 * frame["T_Umgebung"] + 0.6 * frame["T_VL_global"] + np.sin(np.linspace(0, 5, len(hours)))
        return frame
    if path.suffix.lower() == ".json":
        return pd.read_json(path)
    return pd.read_csv(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--target", default="T_Mittel_Rx")
    parser.add_argument("--model-out", default="temperature_baseline.joblib")
    parser.add_argument("--metrics-out", default="temperature_baseline_metrics.json")
    args = parser.parse_args()

    df = add_time_features(load_data(Path(args.input)))
    if args.target not in df.columns:
        raise SystemExit(f"Target column {args.target} missing")

    df = df.dropna(subset=[args.target]).copy()
    feature_cols = [column for column in select_feature_columns(df) if column != args.target]
    X = df[feature_cols].fillna(0)
    y = df[args.target]

    if "batch_id" in df.columns and df["batch_id"].dropna().nunique() > 1:
        train_batches, test_batches = train_test_split(df["batch_id"].dropna().unique(), test_size=0.2, random_state=42)
        train_mask = df["batch_id"].isin(train_batches)
        test_mask = df["batch_id"].isin(test_batches)
        X_train, X_test, y_train, y_test = X.loc[train_mask], X.loc[test_mask], y.loc[train_mask], y.loc[test_mask]
    else:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    metrics = {
        "mae": mean_absolute_error(y_test, preds),
        "rmse": mean_squared_error(y_test, preds, squared=False),
        "r2": r2_score(y_test, preds),
        "feature_importances": dict(sorted(zip(feature_cols, model.feature_importances_), key=lambda item: item[1], reverse=True)[:25]),
    }

    joblib.dump({"model": model, "features": feature_cols}, args.model_out)
    Path(args.metrics_out).write_text(json.dumps(metrics, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
