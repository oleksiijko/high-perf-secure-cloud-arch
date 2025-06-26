const express = require('express');
const morgan   = require('morgan');

const authRouter      = require('./routers/auth');
const profileRouter   = require('./routers/profile');
const contentRouter   = require('./routers/content');
const analyticsRouter = require('./routers/analytics');

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(morgan('combined'));
app.use(express.json());

app.use('/api/auth',      authRouter);
app.use('/api/profile',   profileRouter);
app.use('/api/content',   contentRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(PORT, () => console.log(`monolith-svc on ${PORT}`));

module.exports = app;
