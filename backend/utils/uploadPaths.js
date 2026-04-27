const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  return UPLOADS_DIR;
}

function resolveUploadPath(filename = "") {
  return path.join(UPLOADS_DIR, path.basename(filename));
}

module.exports = {
  UPLOADS_DIR,
  ensureUploadsDir,
  resolveUploadPath,
};
