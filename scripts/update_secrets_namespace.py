#!/usr/bin/env python3
"""Ensure secrets.yaml objects have namespace 'microservices'.
Reads all YAML files under k8s/ to verify syntax.
"""

from pathlib import Path

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover - install if missing
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml"])
    import yaml


def main() -> None:
    base = Path('k8s')
    files = list(base.rglob('*.yaml'))
    for path in files:
        with open(path, 'r') as f:
            docs = list(yaml.safe_load_all(f))
        if path.name == 'secrets.yaml':
            updated = False
            for doc in docs:
                metadata = doc.setdefault('metadata', {})
                if metadata.get('namespace') != 'microservices':
                    metadata['namespace'] = 'microservices'
                    updated = True
            if updated:
                with open(path, 'w') as f:
                    yaml.dump_all(docs, f)


if __name__ == '__main__':
    main()
