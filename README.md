# high-perf-secure-cloud-arch

This repository accompanies the article **"Architectural Solutions for High-Performance Secure Cloud Applications"**. It demonstrates a simple microservices stack with infrastructure-as-code and load testing tools.

## Requirements
- Docker >= 24
- Terraform >= 1.7
- AWS CLI v2 configured with a free-tier account

## Quick Start

### Build and Start Services
```bash
# build-up
docker-compose up -d
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

## Terraform Usage
```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply
```
The provided configuration deploys a small ECS cluster behind an Application Load Balancer. Autoscaling keeps 1–3 tasks running based on CPU load.

## JMeter Example
Use the following command line when running tests. JMeter sends requests to `http://localhost:3001` by default:
```bash
jmeter -n -t jmeter/microservices-test-plan.jmx \
    -Jjwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Logs
Sample run data lives in `logs/sample_run.csv` for reference.

## License
Content is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
