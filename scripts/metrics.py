#!/usr/bin/env python3
"""Aggregate JMeter results and gate builds on performance."""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd


def parse_jtl(path: Path) -> tuple[float, float, float, float, float]:
    """Return throughput and latency percentiles for a JTL file."""
    df = pd.read_csv(path)
    total   = len(df)
    errors  = total - df['success'].sum() if 'success' in df.columns else 0
    err_rate = errors / total if total else 0
    start = df['timeStamp'].min()
    end = df['timeStamp'].max()
    duration = (end - start) / 1000.0
    throughput = len(df) / duration if duration else 0.0
    lat_col = 'Latency' if 'Latency' in df.columns else 'elapsed'
    lat = pd.to_numeric(df[lat_col], errors='coerce').dropna()
    p50 = float(np.percentile(lat, 50)) if not lat.empty else 0.0
    p95 = float(np.percentile(lat, 95)) if not lat.empty else 0.0
    p99 = float(np.percentile(lat, 99)) if not lat.empty else 0.0
    return throughput, p50, p95, p99, err_rate


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Aggregate JMeter results")
    parser.add_argument("results", help="Directory with result JTL files")
    args = parser.parse_args(argv)

    base = Path(args.results)
    profiles = ["light", "medium", "heavy"]
    iterations = range(1, 4)
    metrics: dict[str, dict[str, list[float]]] = {
        p: {"throughput": [], "p50": [], "p95": [], "p99": [], "error": []} for p in profiles
    }

    for prof in profiles:
        for i in iterations:
            f = base / f"{prof}-{i}.jtl"
            if not f.exists():
                print(f"missing {f}", file=sys.stderr)
                continue
            tp, p50, p95, p99, er = parse_jtl(f)
            metrics[prof]["throughput"].append(tp)
            metrics[prof]["p50"].append(p50)
            metrics[prof]["p95"].append(p95)
            metrics[prof]["p99"].append(p99)
            metrics[prof]["error"].append(er * 100)

    tp_threshold = float(os.getenv("THROUGHPUT_THRESHOLD", "0"))
    lat_threshold = float(os.getenv("LATENCY_THRESHOLD", "1e9"))
    rows: list[tuple[str, str, float, float]] = []
    fail = False

    for prof, data in metrics.items():
        for metric, vals in data.items():
            mean = float(np.mean(vals)) if vals else 0.0
            std = float(np.std(vals, ddof=1)) if len(vals) > 1 else 0.0
            rows.append((prof, metric, mean, std))
        
        if data["error"]:
            error_mean = float(np.mean(data["error"]))
            rows.append((prof, "error_rate_pct", error_mean, 0.0))
        
        if data["throughput"] and np.mean(data["throughput"]) < tp_threshold:
            fail = True
        if data["p95"] and np.mean(data["p95"]) > lat_threshold:
            fail = True

    print("Profile,Metric,Mean,StdDev")
    for prof, metric, mean, std in rows:
        print(f"{prof},{metric},{mean:.2f},{std:.2f}")

    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))