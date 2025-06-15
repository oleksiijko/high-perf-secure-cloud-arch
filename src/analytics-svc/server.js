const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/analytics', (req, res) => res.json({data: []}));
if (require.main === module) {
  app.listen(3000, () => console.log('analytics-svc listening'));
}

module.exports = app;

