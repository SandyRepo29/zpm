const postgres = require('postgres');
require('dotenv').config();

// Supabase pooler: URL parsing mangles "postgres.PROJECT_REF" usernames.
// Use explicit params to preserve the full username.
const sql = postgres({
  host:     process.env.DB_HOST     || 'aws-1-ap-southeast-1.pooler.supabase.com',
  port:     Number(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME     || 'postgres',
  username: process.env.DB_USER     || 'postgres.fsghwrmbplhjkcswhvfg',
  password: process.env.DB_PASSWORD || '',
  ssl:      'require',
  max:      10,
});

module.exports = sql;
