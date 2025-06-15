# high-perf-secure-cloud-arch
![CI](https://github.com/oleksiijko/high-perf-secure-cloud-arch/actions/workflows/ci.yml/badge.svg)
## Current version: v1.0.0

This repository accompanies the article **"Architectural Solutions for High-Performance Secure Cloud Applications"**. It demonstrates a simple microservices stack with infrastructure-as-code and load testing tools.

## Requirements
- Docker >= 24
- Terraform >= 1.7
- AWS CLI v2 configured with a free-tier account
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` must be set for Terraform
- `JWT` token used by JMeter load tests

## Quick Start

### Build and Start Services
```bash
docker compose build
npm test
# build-up
docker-compose up -d
```

### Build custom images
```bash
docker compose build
```

### Run Tests
```bash
npm ci
npm test
```
The script `scripts/aggregate_metrics.py` aggregates JMeter metrics.

### Run Load Tests
```bash
# run-tests
jmeter -n -t jmeter/microservices-test-plan.jmx -Jjwt=<your_jwt>
```

### Tear Down Infrastructure
```bash
# teardown
terraform -chdir=terraform destroy
```

## Architecture Diagram
![System Architecture](docs/architecture.png)

## Terraform Usage
```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply
```
Run `terraform -chdir=terraform init` once to download providers and then
`terraform -chdir=terraform apply` to create the infrastructure.
The provided configuration deploys a small ECS cluster behind an Application Load Balancer. Autoscaling keeps 1–3 tasks running based on CPU load.

## JMeter Example
Install JMeter via `brew install jmeter` or download it from the [official archive](https://jmeter.apache.org/download_jmeter.cgi).
```bash
jmeter -n -t jmeter/microservices-test-plan.jmx \
    -Jjwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Logs
Sample run data lives in `logs/sample_run.csv` for reference. The script
`scripts/plot_metrics.py` generates `reports/perf-baseline-vs-micro.pdf`.

## Supplementary Material
[Supplementary_S1.zip](docs/Supplementary_S1.zip) contains additional datasets.

## License
Content is licensed under the [MIT](LICENSE) license.

DOI: 10.5281/zenodo.xxxxxxx
