import { pool } from "@workspace/db";
import { scryptSync, randomBytes } from "crypto";

const ADMIN_EMAIL = "alphuplift@gmail.com";
const ADMIN_PASSWORD = "AfraLink2024!";
const ADMIN_NAME = "AfraLink Admin";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seedAdmin() {
  console.log(`Setting up admin user: ${ADMIN_EMAIL}`);

  const { rows: existing } = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [ADMIN_EMAIL]
  );

  const passwordHash = hashPassword(ADMIN_PASSWORD);

  if (existing.length > 0) {
    await pool.query(
      "UPDATE users SET role = 'admin', password_hash = $1, updated_at = NOW() WHERE email = $2",
      [passwordHash, ADMIN_EMAIL]
    );
    console.log("Updated existing user to admin role.");
  } else {
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'admin', NOW(), NOW())`,
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME, "AfraLink", "Admin"]
    );
    console.log("Created new admin user.");
  }

  console.log(`\nAdmin ready:`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  await pool.end();
  process.exit(0);
}

seedAdmin().catch((e) => { console.error(e); process.exit(1); });
