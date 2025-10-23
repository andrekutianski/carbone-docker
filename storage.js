const crypto = require("crypto");
const fs = require("fs-extra");
const path = require("path");

class Storage {
  constructor(rootPath) {
    this.rootPath = rootPath;
  }

  // try writing a file to confirm the location to store files
  // at works as intended
  validate() {
    fs.ensureDirSync(this.rootPath);
    const testFilePath = path.join(this.rootPath, "test.txt");
    const testFileContent =
      "This is a test file to confirm the carbone server can write to this directory.";
    fs.writeFileSync(testFilePath, testFileContent, "utf8");
    const content = fs.readFileSync(testFilePath, "utf8");

    if (content !== testFileContent) {
      throw new Error(
        `file storage location ${this.rootPath} can't store files`
      );
    }
  }

  store(data) {
    const hasher = crypto.createHash("sha256");
    hasher.update(data);
    const hash = hasher.digest("hex");

    const directoryPath = path.join(this.rootPath, hash);
    fs.ensureDirSync(directoryPath);
    const filePath = path.join(directoryPath, "result.pdf");
    fs.writeFileSync(filePath, data);

    return hash;
  }

  isHash(value) {
    return typeof value === "string" && /[0-9a-f]{64}$/.test(value);
  }

  path(hash) {
    return path.join(this.rootPath, hash, "result.pdf");
  }
}

module.exports = { Storage };
