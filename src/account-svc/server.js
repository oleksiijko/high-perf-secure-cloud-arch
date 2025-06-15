const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/profile', (req, res) => res.json({ user: 'demo' }));

module.exports = app;
if (require.main === module) app.listen(3000);

