try:
    import pandas as pd
except ModuleNotFoundError:
    import subprocess
    import sys
    print("pandas not found, installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas"])
    import pandas as pd

import argparse
from pathlib import Path

def _load_metrics(path: str) -> tuple[float, float]:
    p = Path(path)
    if not p.exists():
        print(f"File {path} not found")
        return 0.0, 0.0

    df = pd.read_csv(path, parse_dates=["timestamp"])
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

    if args.baseline and args.secure:
        baseline_tp, baseline_p95 = _load_metrics(args.baseline)
        secure_tp, secure_p95 = _load_metrics(args.secure)

        tp_gain = ((secure_tp - baseline_tp) / baseline_tp * 100) if baseline_tp else 0.0
        latency_change = ((secure_p95 - baseline_p95) / baseline_p95 * 100) if baseline_p95 else 0.0

        print(f"Throughput: {secure_tp:.1f} req/s")
        print(f"95th-percentile latency: {secure_p95:.0f} ms")
        print(f"Gain: {tp_gain:+.1f}% throughput, {latency_change:+.1f}% latency")
    else:
        file_path = args.baseline or args.secure or "logs/sample_run.csv"
        tp, p95 = _load_metrics(file_path)
        print(f"Throughput: {tp:.1f} req/s")
        print(f"95th-percentile latency: {p95:.0f} ms")

if __name__ == '__main__':
    main()
