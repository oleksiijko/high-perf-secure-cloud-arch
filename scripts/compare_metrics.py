import pandas as pd, sys
base   = pd.read_csv('summary-baseline.txt')
secure = pd.read_csv('summary-secure.txt')

joined = secure.merge(base, on='profile', suffixes=('_sec', '_base'))
joined['tp_gain_%']  = (joined['throughput_sec']/joined['throughput_base'] - 1)*100
joined['p95_drop_%'] = (1 - joined['p95_sec']/joined['p95_base'])*100
joined.to_csv('delta.csv', index=False)

print('\n=== Δ Secure vs Baseline ===')
print(joined[['profile','tp_gain_%','p95_drop_%']].round(1).to_string(index=False))
