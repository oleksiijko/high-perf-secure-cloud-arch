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

### Build and Start Services (HTTPS)
```bash
docker compose build
docker compose up -d
```
Services expose HTTPS endpoints on ports 3001-3003 using the self-signed
certificates from the `certs/` folder.

### Build custom images
```bash
docker compose build
```

### Run Tests
```bash
npm ci
npm test
```
Run `python scripts/aggregate_metrics.py` to aggregate metrics and
`python scripts/plot_metrics.py` to generate graphs under `reports/`.

### Run Load Tests
```bash
# run-tests
jmeter -n -t jmeter/microservices-test-plan.jmx
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
jmeter -n -t jmeter/microservices-test-plan.jmx
```

## Logs
Sample run data lives in `logs/baseline_run.csv` and `logs/secure_run.csv`.
Run `python scripts/aggregate_metrics.py` followed by
`python scripts/plot_metrics.py` to create reports.

## Security
All protected endpoints expect a JWT header:
```
Authorization: Bearer <your-token>
```
Tokens are validated using the secret `demo-secret`.

### Local Testing
```bash
curl -k -H "Authorization: Bearer test" https://localhost:3001/api/profile
```

### CI Commands
The GitHub Actions workflow runs:
```bash
npm ci && npm test
terraform -chdir=terraform init -backend=false
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform validate
python scripts/aggregate_metrics.py
python scripts/plot_metrics.py
```

## Supplementary Material
[Supplementary_S1.zip](docs/Supplementary_S1.zip) contains additional datasets.

## License
Content is licensed under the [MIT](LICENSE) license.

DOI: 10.5281/zenodo.xxxxxxx
