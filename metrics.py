import os
import sys
from pathlib import Path
import pandas as pd
import numpy as np

THROUGHPUT_THRESHOLD = float(os.environ.get("THROUGHPUT_THRESHOLD", "0"))
LATENCY_THRESHOLD = float(os.environ.get("LATENCY_THRESHOLD", "1e9"))

PROFILES = ["light", "medium", "heavy"]
ITERATIONS = [1, 2, 3]

def parse_jtl(path: Path):
    df = pd.read_csv(path)
    if "timeStamp" not in df.columns or "elapsed" not in df.columns:
        raise ValueError(f"Unexpected JTL format in {path}")
    duration = (df["timeStamp"].iloc[-1] - df["timeStamp"].iloc[0]) / 1000.0
    duration = duration if duration > 0 else 1
    successes = df[df.get("success", True) == True].shape[0]
    throughput = successes / duration
    p50 = df["elapsed"].quantile(0.50)
    p95 = df["elapsed"].quantile(0.95)
    p99 = df["elapsed"].quantile(0.99)
    return throughput, p50, p95, p99

def aggregate_metrics(results_dir: Path):
    rows = []
    fail = False
    for profile in PROFILES:
        thr, p50s, p95s, p99s = [], [], [], []
        for i in ITERATIONS:
            file_path = results_dir / f"{profile}-{i}.jtl"
            throughput, p50, p95, p99 = parse_jtl(file_path)
            thr.append(throughput)
            p50s.append(p50)
            p95s.append(p95)
            p99s.append(p99)
        stats = {
            "throughput": (np.mean(thr), np.std(thr, ddof=1)),
            "p50": (np.mean(p50s), np.std(p50s, ddof=1)),
            "p95": (np.mean(p95s), np.std(p95s, ddof=1)),
            "p99": (np.mean(p99s), np.std(p99s, ddof=1)),
        }
        if (
            stats["throughput"][0] < THROUGHPUT_THRESHOLD
            or stats["p95"][0] > LATENCY_THRESHOLD
        ):
            fail = True
        for metric, (mean, std) in stats.items():
            rows.append([profile, metric, mean, std])
    return rows, fail

def print_markdown(rows):
    print("| Profile | Metric | Mean | StdDev |")
    print("|---------|--------|------|-------|")
    for profile, metric, mean, std in rows:
        print(f"| {profile} | {metric} | {mean:.2f} | {std:.2f} |")

def main():
    if len(sys.argv) != 2:
        print("Usage: metrics.py <results_dir>")
        sys.exit(1)
    results_dir = Path(sys.argv[1])
    rows, fail = aggregate_metrics(results_dir)
    print_markdown(rows)
    if fail:
        sys.exit(1)

if __name__ == "__main__":
    main()
