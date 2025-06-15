const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.send('healthy'));
app.post('/api/content', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
if (require.main === module) app.listen(3000);

