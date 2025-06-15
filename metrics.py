try:
    import pandas as pd
except ModuleNotFoundError:
    print("pandas not installed, skipping metrics aggregation")
    raise SystemExit(0)

import matplotlib.pyplot as plt
from pathlib import Path

baseline_throughput = 200  # requests per second
baseline_latency = 345      # milliseconds


def main():
    df = pd.read_csv('logs/sample_run.csv', parse_dates=['timestamp'])
    df['second'] = df['timestamp'].dt.floor('S')

    latency = df.groupby('second')['rt_ms'].mean()
    throughput = df.groupby('second').size()

    avg_latency = latency.mean()
    avg_throughput = throughput.mean()

    throughput_gain = 100 * (avg_throughput - baseline_throughput) / baseline_throughput
    latency_drop = 100 * (baseline_latency - avg_latency) / baseline_latency

    print(f'Throughput gain: {throughput_gain:.1f}%')
    print(f'Latency drop: {latency_drop:.1f}%')

    fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    latency.plot(ax=axes[0], title='Latency (ms)')
    axes[0].set_ylabel('ms')
    throughput.plot(ax=axes[1], title='Throughput (RPS)')
    axes[1].set_ylabel('req/s')
    fig.tight_layout()

    Path('reports').mkdir(exist_ok=True)
    report_path = Path('reports/metrics_report.pdf')
    fig.savefig(report_path)

    print(f'Report saved to {report_path}')


if __name__ == '__main__':
    main()
