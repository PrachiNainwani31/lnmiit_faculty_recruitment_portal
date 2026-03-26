const csv = require("csv-parser");
const fs = require("fs");

const normalize = (obj) => {
  const clean = {};
  for (const key in obj) {
    clean[key.trim().replace(/\uFEFF/g, "")] = obj[key]?.trim();
  }
  return clean;
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(normalize(data)))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

module.exports = parseCSV;