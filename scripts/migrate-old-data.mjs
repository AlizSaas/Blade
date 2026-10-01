// One-off data migration script: copies all rows from the OLD Neon database
// (Azure region, about to be deprecated) into the NEW Neon database (AWS region).
// Usage: node scripts/migrate-old-data.mjs
//
// Requires OLD_DATABASE_URL and DATABASE_URL (or DIRECT_URL) to be set in .env.
// Safe to re-run: uses `skipDuplicates` so already-migrated rows are not duplicated.

import { PrismaClient } from "../src/generated/prisma/index.js";
import "dotenv/config";

const oldDb = new PrismaClient({
  datasources: { db: { url: process.env.OLD_DATABASE_URL } },
});
const newDb = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

// Order matters: parents before children, to satisfy foreign key constraints.
async function migrate() {
  const steps = [
    { name: "Company", copy: () => oldDb.company.findMany(), insert: (rows) => newDb.company.createMany({ data: rows, skipDuplicates: true }) },
    { name: "Code", copy: () => oldDb.code.findMany(), insert: (rows) => newDb.code.createMany({ data: rows, skipDuplicates: true }) },
    { name: "User", copy: () => oldDb.user.findMany(), insert: (rows) => newDb.user.createMany({ data: rows, skipDuplicates: true }) },
    { name: "BikeRequest", copy: () => oldDb.bikeRequest.findMany(), insert: (rows) => newDb.bikeRequest.createMany({ data: rows, skipDuplicates: true }) },
    { name: "Conversation", copy: () => oldDb.conversation.findMany(), insert: (rows) => newDb.conversation.createMany({ data: rows, skipDuplicates: true }) },
    { name: "Message", copy: () => oldDb.message.findMany(), insert: (rows) => newDb.message.createMany({ data: rows, skipDuplicates: true }) },
    { name: "Subscription", copy: () => oldDb.subscription.findMany(), insert: (rows) => newDb.subscription.createMany({ data: rows, skipDuplicates: true }) },
  ];

  for (const step of steps) {
    const rows = await step.copy();
    if (rows.length === 0) {
      console.log(`${step.name}: 0 rows found, skipping`);
      continue;
    }
    const result = await step.insert(rows);
    console.log(`${step.name}: copied ${result.count}/${rows.length} rows`);
  }
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  });
