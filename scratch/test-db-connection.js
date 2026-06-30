const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Manually parse .env file to get DATABASE_URL
const envPath = path.join(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
let databaseUrl = "";

envContent.split("\n").forEach(line => {
  if (line.startsWith("DATABASE_URL=")) {
    // Remove DATABASE_URL= and quotes
    databaseUrl = line.substring("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
  }
});

console.log("Connecting to:", databaseUrl);

const pool = new Pool({ connectionString: databaseUrl });

pool.query("SELECT NOW()")
  .then(res => {
    console.log("Success! Server time:", res.rows[0]);
    pool.end();
  })
  .catch(err => {
    console.error("Connection failed:", err);
    pool.end();
  });
