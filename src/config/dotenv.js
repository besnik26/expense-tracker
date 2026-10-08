const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  get PORT() {
    return process.env.PORT || 5000;
  },
  get MONGODB_URI() {
    return process.env.MONGODB_URI || '';
  },
  get USE_MEMORY_DB() {
    return process.env.USE_MEMORY_DB === 'true';
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET || '';
  },
  get JWT_EXPIRES_IN() {
    return process.env.JWT_EXPIRES_IN || '7d';
  },
};
