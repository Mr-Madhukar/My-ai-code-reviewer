import { db } from "../packages/db/src/index";
import fs from "fs";
import path from "path";

const envPath = path.join(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
envContent.split("\n").forEach(line => {
  if (line.startsWith("DATABASE_URL=")) {
    process.env.DATABASE_URL = line.substring("DATABASE_URL=".length).trim().replace(/^"|"$/g, "");
  }
});

async function main() {
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL);
  try {
    const userCount = await db.user.count();
    console.log("Success! User count:", userCount);
  } catch (err) {
    console.error("Prisma query failed:", err);
  }
}

main();
