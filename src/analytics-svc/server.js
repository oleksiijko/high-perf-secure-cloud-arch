const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const logFile = path.join(__dirname, '../../logs/sample_run.csv');
if (!fs.existsSync(logFile)) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, 'timestamp,url,rt_ms,http_code\n');
}

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const line = `${new Date().toISOString()},${req.originalUrl},${ms.toFixed(0)},${res.statusCode}\n`;
    fs.appendFileSync(logFile, line);
  });
  next();
});

app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/analytics', (req, res) => res.json({ data: [] }));

module.exports = app;
if (require.main === module) app.listen(3000);

