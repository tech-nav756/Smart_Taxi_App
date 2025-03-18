// utils/ipUtils.js

const getClientIP = (req) => {
    // Get client IP, accounting for proxies
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  };
  
  module.exports = getClientIP;
  