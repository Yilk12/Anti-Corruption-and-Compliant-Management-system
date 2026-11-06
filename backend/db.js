// db.js

const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'ICSDS',
  password: 'Yile123Dev',
  port: 5432,
});

client.connect();

client.query('SELECT NOW()', (err, res) => {
  console.log(err ? err.stack : res.rows[0]);
  client.end();
});
