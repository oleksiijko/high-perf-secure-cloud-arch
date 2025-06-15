const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.send('healthy'));
app.get('/api/profile', (req, res) => res.json({user: 'demo'}));
if (require.main === module) {
  app.listen(3000, () => console.log('account-svc listening'));
}

module.exports = app;

