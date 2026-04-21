const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "config/.env") });

const connectDatabase = require("./db/Database");
const Shop = require("./model/shop");
const Product = require("./model/product");

const DRY_RUN = process.argv.includes("--dry-run");
const JSON_FILE = process.env.IMPORT_JSON_FILE || "qazprovide_full_import.json";
const UPLOADS_DIR = process.env.IMPORT_UPLOADS_DIR || path.join(__dirname, "uploads");
const DEFAULT_PASSWORD = process.env.IMPORT_DEFAULT_PASSWORD || "Import123!";
const DEFAULT_STOCK = Number(process.env.IMPORT_DEFAULT_STOCK || 100);
const DEFAULT_ZIP = Number(process.env.IMPORT_DEFAULT_ZIP || 100000);

function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "seller";
}

function toNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return fallback;
  const cleaned = String(value).replace(/\s+/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function splitPhotos(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 7000000000;
  if (digits.length >= 10) return Number(digits.slice(0, 15));
  return Number((digits + "0000000000").slice(0, 10));
}

function makeSellerEmail(distributor) {
  const raw = String(distributor ?? "").trim();
  return `${slugify(raw)}@import.local`;
}

function shopSnapshot(shopDoc) {
  return {
    _id: shopDoc._id,
    name: shopDoc.name,
    email: shopDoc.email,
    description: shopDoc.description,
    address: shopDoc.address,
    phoneNumber: shopDoc.phoneNumber,
    role: shopDoc.role,
    avatar: shopDoc.avatar,
    zipCode: shopDoc.zipCode,
  };
}

function fileExistsInUploads(filename) {
  return fs.existsSync(path.join(UPLOADS_DIR, filename));
}

async function main() {
  const jsonPath = path.join(__dirname, JSON_FILE);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON file not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf8");
  const rows = JSON.parse(raw);

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Import data is empty.");
  }

  await connectDatabase();

  let createdShops = 0;
  let updatedShops = 0;
  let reusedShops = 0;
  let createdProducts = 0;
  let updatedProducts = 0;

  const missingFiles = [];
  const skippedRows = [];
  const shopCache = new Map();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    const excelRowNumber = index + 2;

    const distributor = String(row["DISTRIBUTOR"] ?? "").trim();
    const productName = String(row["NAME"] ?? "").trim();
    const tag = String(row["TAG"] ?? "").trim();
    const category = String(row["Category"] ?? "").trim();
    const productDescription = String(row["Product description"] ?? "").trim();
    const distributorDescription = String(row["Distr description"] ?? "").trim();
    const productPhotos = splitPhotos(row["Product photo"]);
    const distributorPhoto = String(row["Distr photo"] ?? "").trim();
    const price = toNumber(row["PRICE (TG – Litr)"], 0);
    const phoneNumber = normalizePhone(row["Number"]);

    if (!distributor || !productName || !category || !productDescription) {
      skippedRows.push({
        excelRow: excelRowNumber,
        reason: "Missing required values",
        distributor,
        productName,
        category,
      });
      continue;
    }

    for (const photo of productPhotos) {
      if (!fileExistsInUploads(photo)) {
        missingFiles.push({ excelRow: excelRowNumber, type: "product", productName, file: photo });
      }
    }
    if (distributorPhoto && !fileExistsInUploads(distributorPhoto)) {
      missingFiles.push({ excelRow: excelRowNumber, type: "seller", distributor, file: distributorPhoto });
    }

    const email = makeSellerEmail(distributor);
    let shop = shopCache.get(email);

    if (!shop) {
      shop = await Shop.findOne({ email }).select("+password");

      if (!shop) {
        const shopPayload = {
          name: distributor,
          email,
          password: DEFAULT_PASSWORD,
          description: distributorDescription || `Imported from spreadsheet for ${distributor}`,
          address: distributor,
          phoneNumber,
          role: "Seller",
          avatar: distributorPhoto || "default-shop.png",
          zipCode: DEFAULT_ZIP,
        };

        if (DRY_RUN) {
          shop = { _id: new mongoose.Types.ObjectId(), ...shopPayload };
        } else {
          shop = await Shop.create(shopPayload);
        }
        createdShops++;
      } else {
        const updates = {
          name: distributor,
          description: distributorDescription || shop.description,
          address: distributor,
          phoneNumber,
          avatar: distributorPhoto || shop.avatar,
          zipCode: shop.zipCode || DEFAULT_ZIP,
        };

        if (!DRY_RUN) {
          await Shop.updateOne({ _id: shop._id }, { $set: updates });
          shop = await Shop.findById(shop._id).select("+password");
        } else {
          shop = { ...shop.toObject?.() ?? shop, ...updates };
        }

        if (Object.keys(updates).length) updatedShops++;
        else reusedShops++;
      }

      shopCache.set(email, shop);
    }

    const productFilter = {
      name: productName,
      shopId: String(shop._id),
    };

    const payload = {
      name: productName,
      description: productDescription,
      category,
      tags: tag,
      originalPrice: price,
      stock: DEFAULT_STOCK,
      images: productPhotos,
      shopId: String(shop._id),
      shop: shopSnapshot(shop),
    };

    const existingProduct = await Product.findOne(productFilter);

    if (existingProduct) {
      if (!DRY_RUN) {
        await Product.updateOne(productFilter, { $set: payload });
      }
      updatedProducts++;
    } else {
      if (!DRY_RUN) {
        await Product.create(payload);
      }
      createdProducts++;
    }
  }

  console.log("Import finished.");
  console.log({
    dryRun: DRY_RUN,
    createdShops,
    updatedShops,
    reusedShops,
    createdProducts,
    updatedProducts,
    skippedRows: skippedRows.length,
    missingFiles: missingFiles.length,
    totalRows: rows.length,
  });

  if (skippedRows.length) {
    console.log("\nSkipped rows:");
    console.log(JSON.stringify(skippedRows, null, 2));
  }

  if (missingFiles.length) {
    console.log("\nMissing upload files:");
    console.log(JSON.stringify(missingFiles, null, 2));
  }

  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error("Import failed:", err);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});