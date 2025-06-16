#!/bin/bash
# Utility functions for performance testing

# Create fresh results directory
create_results_dir() {
  local dir="$1"
  rm -rf "$dir"
  mkdir -p "$dir"
}

# Flush Redis data inside the cluster
flush_cache() {
  kubectl exec deploy/redis -- redis-cli FLUSHALL
}

# Ensure Python and JMeter are available
setup_tools() {
  sudo apt-get update
  sudo apt-get install -y jmeter
  pip install --quiet pandas numpy
}


