#!/usr/bin/env node

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(packageRoot, "template");
const manifestPath = path.join(templateRoot, ".agents", "harness-manifest.json");

function usage() {
  console.log(`Commercial Fusion Assembly Harness

Usage:
  commercial-fusion-harness init [target] [--force] [--dry-run]
  commercial-fusion-harness update [target] [--dry-run]

init     Install the canonical harness into a new or empty project.
update   Refresh canonical harness files while preserving other project files.
--force  Allow init to replace existing canonical files.
--dry-run  Show planned changes without writing files.
`);
}

function parseArgs(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") return { command: "help" };
  const [command = "help", ...rest] = argv;
  let target = ".";
  let force = false;
  let dryRun = false;
  for (const arg of rest) {
    if (arg === "--force") force = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--help" || arg === "-h") return { command: "help" };
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (target === ".") target = arg;
    else throw new Error(`Only one target directory is allowed; got ${target} and ${arg}.`);
  }
  return { command, target, force, dryRun };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help") {
    usage();
    return;
  }
  if (options.command !== "init" && options.command !== "update") {
    throw new Error(`Unknown command: ${options.command}`);
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const relativeEntries = [
    ...manifest.skills,
    ...manifest.subagents,
    ...manifest.commands,
    "harness-manifest.json",
  ].map((entry) => path.join(".agents", entry));
  const targetRoot = path.resolve(process.cwd(), options.target);
  const overwrite = options.command === "update" || options.force;

  const planned = [];
  for (const relativeEntry of relativeEntries) {
    const source = path.join(templateRoot, relativeEntry);
    const destination = path.join(targetRoot, relativeEntry);
    if (!existsSync(source)) throw new Error(`Template entry is missing: ${relativeEntry}`);
    if (existsSync(destination) && !overwrite) {
      throw new Error(
        `Refusing to overwrite ${path.relative(targetRoot, destination)}. ` +
          "Use 'update' or pass --force to init."
      );
    }
    planned.push({ source, destination, relativeEntry });
  }

  console.log(`${options.command === "update" ? "Updating" : "Installing"} ${manifest.name} ${manifest.version}`);
  console.log(`Target: ${targetRoot}`);
  for (const item of planned) {
    console.log(`  ${options.dryRun ? "would copy" : "copying"} ${item.relativeEntry}`);
    if (options.dryRun) continue;
    await mkdir(path.dirname(item.destination), { recursive: true });
    await cp(item.source, item.destination, { recursive: true, force: true });
  }

  if (!options.dryRun) {
    const installMetadata = {
      name: manifest.name,
      version: manifest.version,
      installed_at: new Date().toISOString(),
      source: "commercial-fusion-assembly-harness",
    };
    const metadataPath = path.join(targetRoot, ".agents", "harness-install.json");
    await writeFile(metadataPath, `${JSON.stringify(installMetadata, null, 2)}\n`, "utf8");
    console.log(`Wrote .agents/harness-install.json`);
    console.log("Fusion MCP and any project task-tracking integration remain user-configured.");
  }
}

main().catch((error) => {
  console.error(`commercial-fusion-harness: ${error.message}`);
  process.exitCode = 1;
});
