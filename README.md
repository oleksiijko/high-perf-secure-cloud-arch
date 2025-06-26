# high-perf-secure-cloud-arch
![CI](https://github.com/oleksiijko/high-perf-secure-cloud-arch/actions/workflows/ci.yml/badge.svg)
## Current version: v1.0.1

This repository accompanies the article **"Architectural Solutions for High-Performance Secure Cloud Applications"**. It demonstrates a simple microservices stack with infrastructure-as-code and load testing tools.

## Requirements
- Docker 20.x
- Kubernetes 1.24+
- Terraform 1.4+
- Istio 1.15+
- Node.js 18.x
- AWS CLI v2 configured with a free-tier account
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` must be set for Terraform

## Quick Start

### Generate self-signed certificates
```bash
openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
  -keyout certs/server.key -out certs/server.crt -subj "/CN=localhost"
cp certs/server.crt certs/ca.crt
```

### Start microservices over HTTPS
```bash
docker compose up -d
```
Each service uses mTLS with the certificates from `certs/`.

### Build custom images
```bash
docker compose build
```

### Run Tests
```bash
npm ci
npm test
```
GitHub Actions executes the same commands in `.github/workflows/ci.yml`. Metrics can be aggregated locally with:
```bash
python3 scripts/aggregate_metrics.py
python3 scripts/plot_metrics.py
```

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
This configuration provisions an EKS cluster with an Istio service mesh. mTLS is enabled between pods by default.

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

### Troubleshooting
For debugging failed deployments in the `kind` cluster see [docs/k8s-debugging.md](docs/k8s-debugging.md).


## Logs
Sample run data lives in `logs/sample_run.csv` for reference. Running
`python metrics.py` generates `reports/metrics_report.pdf`.

## Security
All API calls require a JWT via the `Authorization` header:
```http
Authorization: Bearer <token>
```
Tokens are verified with the dummy secret `demo-secret`. Payloads must contain a `role` claim used by the ABAC middleware. Example token payload:
```json
{
  "sub": "123",
  "role": "admin"
}
```
IDS alerts are written to the service logs whenever a pattern like `' OR 1=1` appears in a request. Check `logs/` for details.

## Supplementary Material
[Supplementary_S1.zip](docs/Supplementary_S1.zip) contains additional datasets.

## Changelog
- v1.0.1: removed inline code comments for clarity

## License
Content is licensed under the [MIT](LICENSE) license.

DOI: https://doi.org/10.5281/zenodo.15746968
