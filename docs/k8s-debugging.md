# Debugging Kubernetes Manifests

This guide collects common steps to diagnose why the microservices defined in `k8s/` may not start in a local **kind** cluster.

1. **List manifest files**
   ```bash
   find k8s -maxdepth 2 -type f -name '*.yaml'
   ```
   Ensure the expected `Deployment` and `Service` YAML files are present.

2. **Apply manifests one by one**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   for f in $(find k8s -name '*.yaml' ! -name 'namespace.yaml' | sort); do
       kubectl apply -f "$f"
   done
   ```
   Watch for errors after each `apply`.

3. **Check the namespace**
   All resources are created in the `microservices` namespace. Use `-n microservices` with `kubectl` commands:
   ```bash
   kubectl get pods -n microservices
   kubectl describe deployment account-svc -n microservices
   ```

4. **Inspect pods and events**
   ```bash
   kubectl get pods -A -o wide
   kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 20
   ```
   Look for `ImagePullBackOff`, `CrashLoopBackOff` or validation errors.

5. **Load local images**
   If Docker images are built locally, load them into kind:
   ```bash
   kind load docker-image account-svc:latest
   ```

Following these steps should reveal missing manifests, invalid YAML or image pull issues that prevent the services from starting.
