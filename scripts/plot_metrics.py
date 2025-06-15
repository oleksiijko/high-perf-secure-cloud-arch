import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


def main():
    baseline = pd.read_csv('logs/baseline_run.csv', parse_dates=['timestamp'])
    secure = pd.read_csv('logs/secure_run.csv', parse_dates=['timestamp'])

    baseline['second'] = baseline['timestamp'].dt.floor('S')
    secure['second'] = secure['timestamp'].dt.floor('S')

    base_latency = baseline.groupby('second')['rt_ms'].mean()
    sec_latency = secure.groupby('second')['rt_ms'].mean()
    base_tp = baseline.groupby('second').size()
    sec_tp = secure.groupby('second').size()

    fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    base_latency.plot(ax=axes[0], label='baseline')
    sec_latency.plot(ax=axes[0], label='secure')
    axes[0].set_title('Latency (ms)')
    axes[0].legend()
    axes[0].set_ylabel('ms')

    base_tp.plot(ax=axes[1], label='baseline')
    sec_tp.plot(ax=axes[1], label='secure')
    axes[1].set_title('Throughput (RPS)')
    axes[1].set_ylabel('req/s')
    axes[1].legend()
    fig.tight_layout()

    Path('reports').mkdir(exist_ok=True)
    Path('reports').mkdir(exist_ok=True)
    fig.savefig('reports/perf-baseline-vs-micro.png')


if __name__ == '__main__':
    main()
