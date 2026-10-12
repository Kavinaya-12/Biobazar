const readline = require("node:readline/promises");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const { samples, getVerifiedTarget } = require("./seed-development-products");

async function main() {
  const target = getVerifiedTarget();
  await mongoose.connect(target.uri);
  if (mongoose.connection.name !== target.database) throw new Error("Connected database name did not match the verified development target.");

  const ids = samples.map((sample) => new mongoose.Types.ObjectId(sample.id));
  const existing = await Product.find({ _id: { $in: ids } }).select("_id sku name image").lean();
  const byId = new Map(existing.map((product) => [String(product._id), product]));
  const conflicts = samples.filter((sample) => {
    const product = byId.get(sample.id);
    return product && product.sku !== sample.sku;
  });
  if (conflicts.length) throw new Error("A known sample ID has a different SKU. No records were changed; inspect those records manually.");

  const pending = samples.filter((sample) => {
    const product = byId.get(sample.id);
    return product && (product.name !== sample.name || product.image !== sample.image);
  });
  console.log(`Development target: ${target.host}/${target.database}`);
  console.log(`Known sample products found: ${existing.length} of ${samples.length}; display updates: ${pending.length}.`);
  console.log("Only name and image fields on records matching both stable sample ID and sample SKU are eligible for update.");
  if (process.argv.includes("--dry-run")) {
    console.log("Dry run complete. No database writes were made.");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`Type MIGRATE ${target.database} to update only the known development sample names and images: `);
    if (answer !== `MIGRATE ${target.database}`) {
      console.log("Confirmation did not match. No database writes were made.");
      return;
    }
  } finally { rl.close(); }

  if (!pending.length) {
    console.log("All known development samples already have the current display data. Nothing was written.");
    return;
  }
  const result = await Product.bulkWrite(pending.map((sample) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(sample.id), sku: sample.sku },
      update: { $set: { name: sample.name, image: sample.image } },
    },
  })), { ordered: true });
  console.log(`Updated display fields for ${result.modifiedCount} known development samples. All other product fields were preserved.`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`Development product display migration stopped: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => { await mongoose.disconnect().catch(() => {}); });
}

module.exports = { main };
