#!/usr/bin/env bash
set -euo pipefail

kubectl apply -f k8s/ -n microservices

deployments=$(kubectl get deployments -n microservices -o jsonpath='{.items[*].metadata.name}')
for d in $deployments; do
  if ! kubectl rollout status deployment/$d -n microservices --timeout=60s; then
    kubectl describe pods -n microservices
    kubectl logs -n microservices --all-containers --tail=50
    exit 1
  fi
done
