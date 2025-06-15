try:
    import pandas as pd
except ModuleNotFoundError:
    import subprocess, sys
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pandas'])
    import pandas as pd

import argparse
import csv


def _load_metrics(path: str) -> tuple[float, float]:
    rows = []
    with open(path, newline='') as f:
        for row in csv.reader(f):
            if not row or row[0].lower() == 'timestamp' or len(row) < 4:
                continue
            rows.append(row[:4])
    if not rows:
        return 0.0, 0.0
    df = pd.DataFrame(rows, columns=['timestamp', 'url', 'rt_ms', 'http_code'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    df['rt_ms'] = pd.to_numeric(df['rt_ms'], errors='coerce')
    df = df.dropna(subset=['timestamp', 'rt_ms'])
    if df.empty:
        return 0.0, 0.0
    duration = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    throughput = len(df) / duration if duration else 0.0
    p95_latency = df['rt_ms'].quantile(0.95)
    return throughput, p95_latency


def main() -> None:
    parser = argparse.ArgumentParser(description='Aggregate benchmark metrics')
    parser.add_argument('--baseline', default='logs/baseline_run.csv', help='CSV with baseline metrics')
    parser.add_argument('--secure', default='logs/secure_run.csv', help='CSV with secure metrics')
    args = parser.parse_args()

    try:
        baseline_tp, baseline_p95 = _load_metrics(args.baseline)
        secure_tp, secure_p95 = _load_metrics(args.secure)
        if baseline_tp or secure_tp:
            tp_change = ((secure_tp - baseline_tp) / baseline_tp * 100) if baseline_tp else 0.0
            latency_change = ((secure_p95 - baseline_p95) / baseline_p95 * 100) if baseline_p95 else 0.0
            print(f'Throughput baseline: {baseline_tp:.1f} req/s, secure: {secure_tp:.1f} req/s')
            print(f'95th-percentile latency baseline: {baseline_p95:.0f} ms, secure: {secure_p95:.0f} ms')
            print(f'Change: {tp_change:+.1f}% throughput, {latency_change:+.1f}% latency')
        else:
            print('logs not found, skipping aggregation')
    except FileNotFoundError:
        print('logs not found, skipping aggregation')


if __name__ == '__main__':
    main()
