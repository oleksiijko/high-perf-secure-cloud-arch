const express = require('express');
const morgan = require('morgan');

const authRouter = require('./routers/auth');
const profileRouter = require('./routers/profile');
const contentRouter = require('./routers/content');
const analyticsRouter = require('./routers/analytics');

const app = express();

app.use(morgan('combined'));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/content', contentRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(80, () => {
  console.log('monolith-svc listening on port 80');
});

module.exports = app;
