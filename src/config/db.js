import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "clinic",
  password: "yourpassword",
  port: 5432,
});

export default pool;
