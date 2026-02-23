import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const targets = [
  {
    from: path.join(root, "backend", ".env.example"),
    to: path.join(root, "backend", ".env"),
  },
  {
    from: path.join(root, "frontend", ".env.example"),
    to: path.join(root, "frontend", ".env"),
  },
];

for (const target of targets) {
  if (!fs.existsSync(target.from)) {
    console.warn(`[setup:env] Missing template: ${target.from}`);
    continue;
  }

  if (fs.existsSync(target.to)) {
    console.log(`[setup:env] Exists, skipped: ${target.to}`);
    continue;
  }

  fs.copyFileSync(target.from, target.to);
  console.log(`[setup:env] Created: ${target.to}`);
}

console.log("[setup:env] Done");
