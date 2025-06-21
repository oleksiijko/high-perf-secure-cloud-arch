import os, datetime, jwt           # PyJWT ≥ 2.9

secret = os.getenv("JWT_SECRET", "demo-secret")
now    = datetime.datetime.now(datetime.timezone.utc)

payload = {
    "sub":  "ci-bot",
    "role": "user",                 # account-svc проверяет .role
    "aud":  "dev-audience",         # нужны, если auth-svc включает проверку
    "iss":  "dev-issuer",
    "iat":  now,
    "exp":  now + datetime.timedelta(minutes=15),
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token if isinstance(token, str) else token.decode(), end="")
