import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import argparse


def _load(path: str):
    df = pd.read_csv(path, parse_dates=['timestamp'])
    df['second'] = df['timestamp'].dt.floor('S')
    latency = df.groupby('second')['rt_ms'].mean()
    throughput = df.groupby('second').size()
    return latency, throughput

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', default='logs/baseline_run.csv')
    parser.add_argument('--secure', default='logs/secure_run.csv')
    parser.add_argument('--out', default='reports/perf-baseline-vs-micro.pdf')
    args = parser.parse_args()

    b_lat, b_tp = _load(args.baseline)
    s_lat, s_tp = _load(args.secure)

    fig, axes = plt.subplots(2, 1, figsize=(8, 6), sharex=True)
    b_lat.plot(ax=axes[0], label='baseline')
    s_lat.plot(ax=axes[0], label='secure')
    axes[0].set_title('Latency (ms)')
    axes[0].set_ylabel('ms')
    axes[0].legend()

    b_tp.plot(ax=axes[1], label='baseline')
    s_tp.plot(ax=axes[1], label='secure')
    axes[1].set_title('Throughput (RPS)')
    axes[1].set_ylabel('req/s')
    axes[1].legend()
    fig.tight_layout()

    Path('reports').mkdir(exist_ok=True)
    out_path = Path(args.out)
    fig.savefig(out_path)
    if out_path.suffix.lower() != '.png':
        fig.savefig(out_path.with_suffix('.png'))


if __name__ == '__main__':
    main()
