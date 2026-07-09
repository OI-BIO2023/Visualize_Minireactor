from __future__ import annotations

import pandas as pd


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    if "timestamp" in out.columns:
        ts = pd.to_datetime(out["timestamp"], errors="coerce", utc=True)
        out["hour_of_day"] = ts.dt.hour.fillna(0)
        out["day_of_week"] = ts.dt.dayofweek.fillna(0)
    if "hours_since_fill" not in out.columns and {"timestamp", "fill_at"}.issubset(out.columns):
        fill = pd.to_datetime(out["fill_at"], errors="coerce", utc=True)
        ts = pd.to_datetime(out["timestamp"], errors="coerce", utc=True)
        out["hours_since_fill"] = (ts - fill).dt.total_seconds().div(3600).fillna(0)
    return out


def select_feature_columns(df: pd.DataFrame) -> list[str]:
    excluded = {"target", "timestamp", "fill_at", "empty_at", "batch_id", "reactor"}
    numeric_columns: list[str] = []
    for column in df.columns:
        if column in excluded:
            continue
        if pd.api.types.is_numeric_dtype(df[column]) or pd.api.types.is_bool_dtype(df[column]):
            numeric_columns.append(column)
    return numeric_columns
