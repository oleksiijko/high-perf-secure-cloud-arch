#!/usr/bin/env python3
"""
Generate a short-lived JWT for CI/JMeter.

Env:
  JWT_SECRET  signing key (defaults to 'demo-secret' — same as k8s Secret)
Prints token to stdout.
"""
import os, datetime, jwt   # PyJWT >=2.9

secret = os.getenv("JWT_SECRET", "demo-secret")
now    = datetime.datetime.utcnow()
payload = {
    "sub":  "ci-bot",
    "role": "user",             # account-svc требует .role
    "iat":  now,
    "exp":  now + datetime.timedelta(minutes=15)
}
print(jwt.encode(payload, secret, algorithm="HS256"))
