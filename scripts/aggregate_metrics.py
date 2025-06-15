try:
    import pandas as pd
except ModuleNotFoundError:
    import subprocess
    import sys
    print("pandas not found, installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas"])
    import pandas as pd

def _load_metrics(path: str) -> tuple[float, float]:
    df = pd.read_csv(path, parse_dates=["timestamp"])
    duration = (df["timestamp"].max() - df["timestamp"].min()).total_seconds()
    throughput = len(df) / duration if duration else 0.0
    p95_latency = df["rt_ms"].quantile(0.95)
    return throughput, p95_latency


def main() -> None:
    baseline_tp, baseline_p95 = _load_metrics("logs/baseline_run.csv")
    secure_tp, secure_p95 = _load_metrics("logs/secure_run.csv")

    tp_gain = (secure_tp - baseline_tp) / baseline_tp * 100 if baseline_tp else 0
    latency_drop = (baseline_p95 - secure_p95) / baseline_p95 * 100 if baseline_p95 else 0

    print(
        f"Throughput: baseline={baseline_tp:.1f} req/s, "
        f"secure={secure_tp:.1f} req/s ({tp_gain:+.1f}%)"
    )
    print(
        f"95th-percentile latency: baseline={baseline_p95:.0f} ms, "
        f"secure={secure_p95:.0f} ms ({latency_drop:+.1f}%)"
    )

if __name__ == '__main__':
    main()
