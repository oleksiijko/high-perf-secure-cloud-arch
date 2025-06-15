const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const line = `${new Date().toISOString()},${req.originalUrl},${ms.toFixed(0)},${res.statusCode}\n`;
    fs.appendFileSync(path.join(__dirname, '../../logs/sample_run.csv'), line);
  });
  next();
});

app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/analytics', (req, res) => res.json({ data: [] }));

module.exports = app;
if (require.main === module) app.listen(3000);

