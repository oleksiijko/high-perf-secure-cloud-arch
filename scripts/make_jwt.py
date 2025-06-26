import os, datetime, jwt

secret = os.getenv("JWT_SECRET", "demo-secret")
now    = datetime.datetime.now(datetime.timezone.utc)

payload = {
    "sub":  "ci-bot",
    "role": "admin",
    "aud":  "dev-audience",
    "iss":  "dev-issuer",
    "iat":  now,
    "exp":  now + datetime.timedelta(minutes=60),
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token if isinstance(token, str) else token.decode(), end="")
