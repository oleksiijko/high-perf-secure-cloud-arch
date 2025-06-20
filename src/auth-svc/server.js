const express = require('express');
const http     = require('http');
const winston  = require('winston');
const auth     = require('./authMiddleware');

const app = express();
app.use(express.json());
app.use(auth());

app.get('/health', (req, res)  => res.send('healthy'));
app.get('/secure', (req, res)  => res.json({ ok: true }));

// простой консольный логгер
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

if (require.main === module) {
  http.createServer(app).listen(3000, () =>
    logger.info('auth-svc HTTP listening on 3000')
  );
}

module.exports = app;
