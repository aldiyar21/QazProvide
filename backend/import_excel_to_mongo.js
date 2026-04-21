const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "config/.env") });

const connectDatabase = require("./db/Database");
const Shop = require("./model/shop");
const Product = require("./model/product");

const DRY_RUN = process.argv.includes("--dry-run");
const DEFAULT_PASSWORD = process.env.IMPORT_DEFAULT_PASSWORD || "Import123!";

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value, fallback = 0) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").replace(/[^\d.\\-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

async function main() {
  const jsonPath = path.join(__dirname, "qazprovide_import_data.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const items = JSON.parse(raw);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Import data is empty.");
  }

  await connectDatabase();

  let createdShops = 0;
  let reusedShops = 0;
  let createdProducts = 0;
  let updatedProducts = 0;

  const shopCache = new Map();

  for (const item of items) {
    const distributor = String(item.distributor || "Unknown distributor").trim();
    const city = String(item.city || "Unknown city").trim();
    const name = String(item.name || "").trim();
    const category = String(item.category || "Uncategorized").trim();
    const tags = String(item.tag || "").trim();
    const price = toNumber(item.price, 0);

    if (!name) continue;

    const email = `${slugify(distributor) || "seller"}@import.local`;

    let shop = shopCache.get(email);
    if (!shop) {
      shop = await Shop.findOne({ email });
      if (!shop) {
        const shopPayload = {
          name: distributor,
          email,
          password: DEFAULT_PASSWORD,
          description: `Imported from Excel. Distributor: ${distributor}. City: ${city}.`,
          address: city || "Imported from Excel",
          phoneNumber: 7000000000 + Math.floor(Math.random() * 99999),
          avatar: "default-shop.png",
          zipCode: 100000,
          role: "Seller",
        };

        if (DRY_RUN) {
          shop = { _id: new mongoose.Types.ObjectId(), ...shopPayload };
        } else {
          shop = await Shop.create(shopPayload);
        }
        createdShops++;
      } else {
        reusedShops++;
      }
      shopCache.set(email, shop);
    }

    const productFilter = {
      name,
      shopId: String(shop._id),
    };

    const productPayload = {
      name,
      description: `Imported from Excel. Distributor: ${distributor}. City: ${city}.`,
      category,
      tags,
      originalPrice: price,
      stock: 100,
      images: [],
      shopId: String(shop._id),
      shop,
    };

    const existingProduct = await Product.findOne(productFilter);

    if (existingProduct) {
      if (!DRY_RUN) {
        await Product.updateOne(productFilter, { $set: productPayload });
      }
      updatedProducts++;
    } else {
      if (!DRY_RUN) {
        await Product.create(productPayload);
      }
      createdProducts++;
    }
  }

  console.log("Import finished.");
  console.log({
    dryRun: DRY_RUN,
    createdShops,
    reusedShops,
    createdProducts,
    updatedProducts,
    totalItems: items.length,
  });

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error("Import failed:", err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});