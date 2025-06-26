const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

function loadPolicy(policyPath) {
  if (!fs.existsSync(policyPath)) return {};
  return JSON.parse(fs.readFileSync(policyPath));
}

module.exports = function(policyFile) {
  const policies = loadPolicy(policyFile || path.join(__dirname, 'policy.json'));
  return (req, res, next) => {
    if (req.path === '/health') return next();
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, {
        audience: process.env.JWT_AUD,
        issuer: process.env.JWT_ISS,
      });
    } catch (err) {
      return res.status(401).send('Unauthorized');
    }
    const resourceKey = `${req.method} ${req.path}`;
    const rules = policies[resourceKey] || [];
    if (rules.length > 0) {
      const allowed = rules.some(r => {
        const roleOk = r.role ? payload.roles?.includes(r.role) : true;
        const attrOk = r.attribute ? payload.attributes?.includes(r.attribute) : true;
        return roleOk && attrOk;
      });
      if (!allowed) return res.status(403).send('Forbidden');
    }
    req.user = payload;
    next();
  };
};
