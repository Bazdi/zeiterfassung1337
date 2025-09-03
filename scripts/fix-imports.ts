import fs from "node:fs";
import path from "node:path";

// Robust import fixer for legacy "/lib/utils" imports.
// - Converts any: from "/lib/utils", from '/lib/utils', from /lib/utils" -> from "@/lib/utils"
// - Converts default imports `cn` and `formatHours` to named imports from utils

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, "src");

const exts = new Set([".ts", ".tsx"]);
const files: string[] = [];

function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (exts.has(path.extname(entry.name))) files.push(p);
  }
}

walk(srcDir);

let changed = 0;
for (const file of files) {
  let text = fs.readFileSync(file, "utf8");
  const before = text;

  // 1) Normalize any variant of `from '/lib/utils'` (quotes optional, spacing flexible)
  // Matches: from "/lib/utils", from '/lib/utils', from /lib/utils"
  text = text.replace(/from\s+(["'])?\/lib\/utils\1?/g, 'from "@/lib/utils"');

  // 2) Default -> named imports for cn and formatHours (quotes optional previously)
  // After step 1, they should already reference @/lib/utils.
  text = text.replace(/import\s+cn\s+from\s+["']@\/lib\/utils["']/g, 'import { cn } from "@/lib/utils"');
  text = text.replace(/import\s+formatHours\s+from\s+["']@\/lib\/utils["']/g, 'import { formatHours } from "@/lib/utils"');

  // Also handle extra spaces between tokens
  text = text.replace(/import\s+\s*cn\s+\s*from\s+\s*"@\/lib\/utils"/g, 'import { cn } from "@/lib/utils"');
  text = text.replace(/import\s+\s*formatHours\s+\s*from\s+\s*"@\/lib\/utils"/g, 'import { formatHours } from "@/lib/utils"');

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
    console.log(`fixed: ${path.relative(projectRoot, file)}`);
  }
}

console.log(`Done. Files updated: ${changed}`);
