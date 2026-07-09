# ML Vorbereitung

Dieser Ordner enthÃ¤lt eine lokale Baseline fÃ¼r Temperaturmodelle auf Batch-Daten.

## Zweck

- Export normalisierter Trainingsdaten aus CSV oder JSON
- Baseline-Training ohne AbhÃ¤ngigkeit vom Frontend
- Zeitbasierter Split pro Batch, keine zufÃ¤llige Durchmischung

## Nutzung

```bash
pip install -r requirements.txt
python export_dataset.py --input data.csv --batches ../data/reactor_batches.json --output dataset.parquet
python train_temperature_baseline.py --input dataset.csv
```
