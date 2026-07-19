import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const patterns = [
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /OPENAI_API_KEY[\t ]*=[\t ]*[^\s#]{8,}/g,
];
const placeholders = /(replace|example|your|test|placeholder|not-a-real|\.\.\.)/i;
const findings = [];

function scanContent(content, location) {
  if (content.includes("\0")) return;
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      if (!placeholders.test(match[0])) findings.push(location);
    }
  }
}

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
for (const file of files) {
  let buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    continue;
  }
  if (buffer.byteLength <= 2 * 1024 * 1024) {
    scanContent(buffer.toString("utf8"), file);
  }
}

const commits = execFileSync("git", ["rev-list", "--all"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);
for (const commit of commits) {
  const historicalFiles = execFileSync("git", ["ls-tree", "-r", "--name-only", "-z", commit], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  for (const file of historicalFiles) {
    let buffer;
    try {
      buffer = execFileSync("git", ["show", `${commit}:${file}`], {
        encoding: "buffer",
        maxBuffer: 3 * 1024 * 1024,
      });
    } catch {
      continue;
    }
    if (buffer.byteLength <= 2 * 1024 * 1024) {
      scanContent(buffer.toString("utf8"), `${commit.slice(0, 7)}:${file}`);
    }
  }
}

const unique = [...new Set(findings)];
if (unique.length) {
  console.error(`Potential credential material found in: ${unique.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Secret scan passed for ${files.length} tracked files and ${commits.length} historical commits.`,
  );
}
