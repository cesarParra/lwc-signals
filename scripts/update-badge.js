const fs = require("fs");

const filePath = "README.md";
const version = process.argv[2]; // Read the version from the command-line arguments

if (!version) {
  console.error("No version provided to update badge.");
  process.exit(1);
}

let content = fs.readFileSync(filePath, "utf8");

// Replace the version badge placeholder
content = content.replace(
  /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-.*?-blue\)/,
  `![Version](https://img.shields.io/badge/version-${version}-blue)`
);

fs.writeFileSync(filePath, content);
console.log(`Updated version badge to ${version} in ${filePath}`);
