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

### Generate certificates and run services
```bash
# one-time generation
./scripts/gen-certs.sh

# build images and start
docker compose build
docker compose up -d
```
All services listen on HTTPS with mutual TLS. Certificates from `certs/` are loaded automatically.

Generate a demo JWT with an `admin` role:
```bash
node -e "console.log(require('jsonwebtoken').sign({sub:'demo',role:'admin'},'demo-secret'))"
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
Run `python metrics.py` to aggregate metrics and generate a PDF report.

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
The Terraform module provisions an EKS cluster with a managed node group. Istio is installed automatically and mTLS is enforced between pods.

### Generate Metrics and Graphs
After running load tests, aggregate logs and create graphs:
```bash
python3 scripts/aggregate_metrics.py
python3 scripts/plot_metrics.py
```

## JMeter Example
Install JMeter via `brew install jmeter` or download it from the [official archive](https://jmeter.apache.org/download_jmeter.cgi).
```bash
jmeter -n -t jmeter/microservices-test-plan.jmx
```

## Kubernetes Manifests
Manifests for running the microservices on Kubernetes live in `k8s/`. They
include Deployments, Services and an Ingress resource. Istio configuration
under `k8s/istio/` enables mutual TLS between the services. Network policies
restrict traffic so only the frontend or other backends can reach the
microservices.

To apply everything:
```bash
kubectl apply -f k8s/
kubectl apply -f k8s/istio/
```

## Logs
Sample runs are stored in `logs/`. After running the services you can aggregate
and visualise metrics locally:
```bash
python3 scripts/aggregate_metrics.py
python3 scripts/plot_metrics.py
```
Any request containing `"' OR 1=1"` will trigger the IDS middleware and a line
`ALERT: возможная SQL-инъекция` will appear in the service logs.

## Security
All API calls require a JWT via the `Authorization` header:
```http
Authorization: Bearer <token>
```
Tokens are verified with the dummy secret `demo-secret`.

### Continuous Integration
The workflow in `.github/workflows/ci.yml` installs Node.js and Python, runs the
unit tests for each service, checks the Terraform configuration and executes the
metric aggregation scripts. A Trivy scan runs only when an `image` argument is
supplied.

## Supplementary Material
[Supplementary_S1.zip](docs/Supplementary_S1.zip) contains additional datasets.

## License
Content is licensed under the [MIT](LICENSE) license.

DOI: 10.5281/zenodo.xxxxxxx
