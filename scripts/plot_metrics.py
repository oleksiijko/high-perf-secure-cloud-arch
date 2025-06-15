import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


def _prepare(path: str):
    df = pd.read_csv(path, parse_dates=['timestamp'])
    df['second'] = df['timestamp'].dt.floor('S')
    latency = df.groupby('second')['rt_ms'].mean()
    throughput = df.groupby('second').size()
    return latency, throughput


def main():
    try:
        base_lat, base_tp = _prepare('logs/baseline_run.csv')
        sec_lat, sec_tp = _prepare('logs/secure_run.csv')
    except FileNotFoundError:
        print('logs not found')
        return

    fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    base_lat.plot(ax=axes[0], label='baseline')
    sec_lat.plot(ax=axes[0], label='secure')
    axes[0].set_title('Latency (ms)')
    axes[0].set_ylabel('ms')
    axes[0].legend()

    base_tp.plot(ax=axes[1], label='baseline')
    sec_tp.plot(ax=axes[1], label='secure')
    axes[1].set_title('Throughput (RPS)')
    axes[1].set_ylabel('req/s')
    axes[1].legend()

    fig.tight_layout()
    Path('reports').mkdir(exist_ok=True)
    fig.savefig('reports/perf-baseline-vs-micro.png')


if __name__ == '__main__':
    main()
