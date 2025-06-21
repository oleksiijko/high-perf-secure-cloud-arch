#!/usr/bin/env python3
"""
Generate a short-lived JWT for CI/JMeter.

Env:
  JWT_SECRET  signing key (defaults to 'demo-secret')
"""
import os, datetime, jwt   # PyJWT >=2.9

secret = os.getenv("JWT_SECRET", "demo-secret")
now    = datetime.datetime.utcnow()

payload = {
    "sub":  "ci-bot",
    "role": "user",
    "aud":  "dev-audience",
    "iss":  "dev-issuer",
    "iat":  now,
    "exp":  now + datetime.timedelta(minutes=15),
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token if isinstance(token, str) else token.decode(), end="")
