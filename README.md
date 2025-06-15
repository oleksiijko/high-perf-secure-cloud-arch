# high-perf-secure-cloud-arch

This repository accompanies the article **"Architectural Solutions for High-Performance Secure Cloud Applications"**. It demonstrates a simple microservices stack with infrastructure-as-code and load testing tools.

## Requirements
- Docker >= 24
- Terraform >= 1.7
- AWS CLI v2 configured with a free-tier account

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

## Local ports

| Service        | Port |
|---------------|------|
| account-svc   | 3001 |
| content-svc   | 3002 |
| analytics-svc | 3003 |

## Architecture Diagram
![System Architecture](docs/architecture.png)

## Terraform Usage
```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply
```
The provided configuration deploys a small ECS cluster behind an Application Load Balancer. Autoscaling keeps 1–3 tasks running based on CPU load.

## JMeter Example
Install JMeter via `brew install jmeter` or download it from the [official archive](https://jmeter.apache.org/download_jmeter.cgi).
Перед запуском JMeter можно изменить порт: `-Jport=3002`.
```bash
jmeter -n -t jmeter/microservices-test-plan.jmx \
    -Jjwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Logs
Sample run data lives in `logs/sample_run.csv` for reference. The script
`scripts/plot_metrics.py` generates `reports/perf-baseline-vs-micro.pdf`.

## License
Content is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).

DOI: 10.5281/zenodo.xxxxxxx
