try:
    import pandas as pd
except ModuleNotFoundError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas"])
    import pandas as pd

import argparse
import csv

def _load_metrics(path: str) -> tuple[float, float]:
    rows = []
    with open(path, newline="") as f:
        for row in csv.reader(f):
            if not row:
                continue
            if row[0].lower() == "timestamp":
                continue
            if len(row) < 4:
                continue
            rows.append(row[:4])

    if not rows:
        return 0.0, 0.0

    df = pd.DataFrame(rows, columns=["timestamp", "url", "rt_ms", "http_code"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["rt_ms"] = pd.to_numeric(df["rt_ms"], errors="coerce")
    df = df.dropna(subset=["timestamp", "rt_ms"])
    if df.empty:
        return 0.0, 0.0

    duration = (df["timestamp"].max() - df["timestamp"].min()).total_seconds()
    throughput = len(df) / duration if duration else 0.0
    p95_latency = df["rt_ms"].quantile(0.95)
    return throughput, p95_latency


def main() -> None:
    parser = argparse.ArgumentParser(description="Aggregate benchmark metrics")
    parser.add_argument("--baseline", help="CSV with baseline metrics")
    parser.add_argument("--secure", help="CSV with secure metrics")
    args = parser.parse_args()

    try:
        baseline_path = args.baseline or 'logs/baseline_run.csv'
        secure_path = args.secure or 'logs/secure_run.csv'
        baseline_tp, baseline_p95 = _load_metrics(baseline_path)
        secure_tp, secure_p95 = _load_metrics(secure_path)

        tp_gain = ((secure_tp - baseline_tp) / baseline_tp * 100) if baseline_tp else 0.0
        latency_change = ((secure_p95 - baseline_p95) / baseline_p95 * 100) if baseline_p95 else 0.0

        print(f"Baseline throughput: {baseline_tp:.1f} req/s")
        print(f"Secure throughput: {secure_tp:.1f} req/s")
        print(f"Throughput change: {tp_gain:+.1f}%")
        print(f"Baseline p95 latency: {baseline_p95:.0f} ms")
        print(f"Secure p95 latency: {secure_p95:.0f} ms")
        print(f"Latency change: {latency_change:+.1f}%")
    except FileNotFoundError:
        print("logs not found, skipping aggregation")

if __name__ == '__main__':
    main()
