const express = require('express');
const app = express();
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/analytics', (req, res) => res.json({ data: [] }));

module.exports = app;
if (require.main === module) app.listen(3000);

