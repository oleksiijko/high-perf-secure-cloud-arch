import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


def main():
    df = pd.read_csv('logs/sample_run.csv', parse_dates=['timestamp'])
    df['second'] = df['timestamp'].dt.floor('S')
    latency = df.groupby('second')['rt_ms'].mean()
    throughput = df.groupby('second').size()

    fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    latency.plot(ax=axes[0], title='Latency (ms)')
    axes[0].set_ylabel('ms')
    throughput.plot(ax=axes[1], title='Throughput (RPS)')
    axes[1].set_ylabel('req/s')
    fig.tight_layout()

    Path('reports').mkdir(exist_ok=True)
    fig.savefig('reports/perf-baseline-vs-micro.pdf')


if __name__ == '__main__':
    main()
