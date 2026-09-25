#!/usr/bin/env node

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(packageRoot, "template");
const manifestPath = path.join(templateRoot, ".agents", "harness-manifest.json");

// Where each agent runtime expects the harness. The template is laid out for Codex;
// Claude Code reads the same files from .claude/, with subagents under agents/.
const layouts = {
  codex: { root: ".agents", subagents: "subagents" },
  claude: { root: ".claude", subagents: "agents" },
};

function usage() {
  console.log(`Commercial Fusion Assembly Harness

Usage:
  commercial-fusion-harness init [target] [--agent codex|claude|both] [--force] [--dry-run]
  commercial-fusion-harness update [target] [--agent codex|claude|both] [--dry-run]

init     Install the canonical harness into a new or empty project.
update   Refresh canonical harness files while preserving other project files.
--agent  Runtime layout: codex (.agents/), claude (.claude/), or both.
         init defaults to codex; update defaults to the layouts already installed.
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
  let agent;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--force") force = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--agent") agent = rest[++i] ?? "";
    else if (arg.startsWith("--agent=")) agent = arg.slice("--agent=".length);
    else if (arg === "--help" || arg === "-h") return { command: "help" };
    else if (arg.startsWith("-")) throw new Error(`Unknown option: ${arg}`);
    else if (target === ".") target = arg;
    else throw new Error(`Only one target directory is allowed; got ${target} and ${arg}.`);
  }
  if (agent !== undefined && agent !== "both" && !Object.hasOwn(layouts, agent)) {
    throw new Error(`--agent must be codex, claude, or both; got ${agent}.`);
  }
  return { command, target, force, dryRun, agent };
}

function selectLayouts(options, targetRoot) {
  if (options.agent === "both") return Object.keys(layouts);
  if (options.agent) return [options.agent];
  if (options.command === "update") {
    const installed = Object.keys(layouts).filter((name) =>
      existsSync(path.join(targetRoot, layouts[name].root, "harness-install.json"))
    );
    if (installed.length > 0) return installed;
  }
  return ["codex"];
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
  const templateEntries = [
    ...manifest.skills,
    ...manifest.subagents,
    ...manifest.commands,
    "harness-manifest.json",
  ];
  const targetRoot = path.resolve(process.cwd(), options.target);
  const overwrite = options.command === "update" || options.force;
  const selected = selectLayouts(options, targetRoot);

  const planned = [];
  for (const name of selected) {
    const layout = layouts[name];
    for (const entry of templateEntries) {
      const source = path.join(templateRoot, ".agents", entry);
      const relativeEntry = path.join(layout.root, entry.replace(/^subagents\//, `${layout.subagents}/`));
      const destination = path.join(targetRoot, relativeEntry);
      if (!existsSync(source)) throw new Error(`Template entry is missing: ${entry}`);
      if (existsSync(destination) && !overwrite) {
        throw new Error(
          `Refusing to overwrite ${path.relative(targetRoot, destination)}. ` +
            "Use 'update' or pass --force to init."
        );
      }
      planned.push({ source, destination, relativeEntry });
    }
  }

  console.log(`${options.command === "update" ? "Updating" : "Installing"} ${manifest.name} ${manifest.version}`);
  console.log(`Target: ${targetRoot} (${selected.join(", ")})`);
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
    for (const name of selected) {
      const metadataPath = path.join(targetRoot, layouts[name].root, "harness-install.json");
      await writeFile(metadataPath, `${JSON.stringify(installMetadata, null, 2)}\n`, "utf8");
      console.log(`Wrote ${path.join(layouts[name].root, "harness-install.json")}`);
    }
    console.log("Fusion MCP and any project task-tracking integration remain user-configured.");
  }
}

main().catch((error) => {
  console.error(`commercial-fusion-harness: ${error.message}`);
  process.exitCode = 1;
});
