import os
import time
import json
import psutil
import requests
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 3000

SIEM_URL = os.getenv('SIEM_URL', 'http://siem.local/ingest')
ALLOWED_DIRS = ['/app', '/usr']
CHECK_INTERVAL = 5
THRESHOLD = 3

container_id = os.getenv('HOSTNAME')
if not container_id:
    try:
        with open('/proc/self/cgroup') as f:
            container_id = f.read().split('/')[-1].strip()
    except Exception:
        container_id = 'unknown'

suspicious_counts = {}

def run_http():
    class Health(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/health':
                self.send_response(200); self.end_headers()
                self.wfile.write(b'healthy')
            else:
                self.send_response(404); self.end_headers()
    HTTPServer(('', PORT), Health).serve_forever()

threading.Thread(target=run_http, daemon=True).start()

while True:
    for proc in psutil.process_iter(['pid', 'open_files', 'cmdline']):
        try:
            files = proc.info['open_files'] or []
            for f in files:
                if not any(f.path.startswith(d) for d in ALLOWED_DIRS):
                    key = f.path
                    suspicious_counts[key] = suspicious_counts.get(key, 0) + 1
                    if suspicious_counts[key] >= THRESHOLD:
                        payload = {
                            'container_id': container_id,
                            'alert': f'Unauthorized file access: {key}',
                            'timestamp': time.time()
                        }
                        try:
                            requests.post(SIEM_URL, json=payload, timeout=2)
                        except Exception:
                            pass
                        suspicious_counts[key] = 0
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    time.sleep(CHECK_INTERVAL)
