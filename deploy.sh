#!/usr/bin/env bash
set -euo pipefail

SERVICES=(account-svc analytics-svc auth-svc content-svc crypto-svc ids-agent)

# Build Docker images
for svc in "${SERVICES[@]}"; do
  echo "Building $svc image..."
  docker build -t "$svc:latest" "./src/$svc"
  echo "Loading $svc image into kind..."
  kind load docker-image "$svc:latest" --name kind
done

# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/

# Wait for deployments to roll out
for svc in "${SERVICES[@]}"; do
  echo "Waiting for deployment $svc..."
  if ! kubectl rollout status deployment/$svc -n microservices --timeout=120s; then
    echo "Deployment $svc failed. Logs from pods:"
    pods=$(kubectl get pods -n microservices -l app=$svc -o jsonpath='{.items[*].metadata.name}')
    for pod in $pods; do
      echo "--- $pod ---"
      kubectl logs $pod -n microservices --all-containers --tail=50 || true
    done
    exit 1
  fi
done

echo "Deployment complete."
