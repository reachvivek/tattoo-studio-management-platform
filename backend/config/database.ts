import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "bookink-db-bookink.j.aivencloud.com",
  port: parseInt(process.env.DB_PORT || "21139"),
  user: process.env.DB_USERNAME || "avnadmin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || "defaultdb",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false, // allows connection without needing a certificate
  },
});

// Event listener for successful connection
pool.on("connect", () => {
  console.log("✅ Database connected successfully");
});

// Event listener for unexpected errors
pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
  process.exit(-1);
});

// Optional helper for queries with timing logs
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query", { text, duration, rows: res.rowCount });
  return res;
};
