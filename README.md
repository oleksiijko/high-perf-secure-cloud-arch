# high-perf-secure-cloud-arch
![CI](https://github.com/oleksiijko/high-perf-secure-cloud-arch/actions/workflows/ci.yml/badge.svg)
## Current version: v1.0.0

This repository accompanies the article **"Architectural Solutions for High-Performance Secure Cloud Applications"**. It demonstrates a simple microservices stack with infrastructure-as-code and load testing tools.

## Requirements
- Docker >= 24
- Terraform >= 1.7
- AWS CLI v2 configured with a free-tier account
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` must be set for Terraform

## Quick Start

### Build and Start Services
```bash
# build containers and start HTTPS services
docker compose build
docker compose up -d
```
Each service exposes HTTPS with self-signed certificates. For local testing use `-k` with curl:
```bash
curl -k -H "Authorization: Bearer demo" https://localhost:3001/health
```

### Run Tests
```bash
npm ci
npm test
```
Run `python3 scripts/plot_metrics.py` and `python3 scripts/aggregate_metrics.py` to generate graphs and metrics reports.

### Terraform
```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply
```
This deploys an ECS cluster behind an Application Load Balancer with autoscaling.

## Security
Services expect a JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```
A simple IDS check blocks requests containing the string `' OR 1=1`.

## Local Benchmark
Load tests can be executed with JMeter:
```bash
jmeter -n -t jmeter/microservices-test-plan.jmx -l logs/secure_run.csv
python3 scripts/aggregate_metrics.py --baseline logs/baseline_run.csv --secure logs/secure_run.csv
python3 scripts/plot_metrics.py
```

## Logs
Sample run data lives in `logs/sample_run.csv` for reference. Generated charts are saved to `reports/perf-baseline-vs-micro.png`.

## Supplementary Material
[Supplementary_S1.zip](docs/Supplementary_S1.zip) contains additional datasets.

## License
Content is licensed under the [MIT](LICENSE) license.

DOI: 10.5281/zenodo.xxxxxxx
