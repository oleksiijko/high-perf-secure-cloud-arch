#!/usr/bin/env bash
# Utility helpers for performance testing with JMeter
# Requires kubectl and jmeter in PATH.

set -euo pipefail

# Create or reset the results directory
prepare_results() {
  local dir=${1:-results}
  rm -rf "$dir"
  mkdir -p "$dir"
}

# Wait until all Kubernetes deployments are available
wait_for_pods() {
  local ns=${1:-microservices}
  kubectl wait --for=condition=available --timeout=300s deployment --all -n "$ns"
}

# Flush Redis cache inside the cluster
flush_redis() {
  kubectl exec deploy/redis -- redis-cli FLUSHALL || true
}


