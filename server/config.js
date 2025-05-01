const dotenv = require('dotenv');

if(process.env.NODE_ENV === 'development') {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}`, debug: true });
}

const server = "eksamen-projekt-server.database.windows.net";
const database = "eksamen-projekt-database";
const port = 1433;
const user = "eksamenAppUser";
const password = "Password!";

const passwordConfig = {
  server,
  port,
  database,
  user,
  password,
  options: {
    encrypt: true
  }
};

module.exports = { passwordConfig };
