import fs from "node:fs";
import path from "node:path";

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

  // Normalize bad absolute imports to the tsconfig alias
  text = text.replace(/from\s+"\/lib\/utils"/g, 'from "@/lib/utils"');
  text = text.replace(/from\s+'\/lib\/utils'/g, "from '@/lib/utils'");

  // Ensure named imports instead of default
  text = text.replace(/import\s+cn\s+from\s+["']@\/lib\/utils["']/g, 'import { cn } from "@/lib/utils"');
  text = text.replace(/import\s+formatHours\s+from\s+["']@\/lib\/utils["']/g, 'import { formatHours } from "@/lib/utils"');

  if (text !== before) {
    fs.writeFileSync(file, text, "utf8");
    changed++;
    console.log(`fixed: ${path.relative(projectRoot, file)}`);
  }
}

console.log(`Done. Files updated: ${changed}`);

