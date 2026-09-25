# Commercial Fusion Assembly Harness

Generic Codex and Claude Code skills, subagent prompts, and repeatable commands for designing and verifying mechanical assemblies made from commercially available parts with Fusion.

## Git-hosted installation

This repository is intended to be consumed directly from GitHub; it does not need to be published to npm.

```powershell
npx --yes --package="github:OWNER/commercial-fusion-assembly-harness#v0.1.0" -- commercial-fusion-harness init my-project
```

For Claude Code, add `--agent claude` (installs into `.claude/skills`, `.claude/agents`, and `.claude/commands`), or `--agent both` for a project shared between Codex and Claude Code. Without the flag, `init` installs the Codex layout under `.agents/`.

To refresh an existing project without replacing unrelated files:

```powershell
npx --yes --package="github:OWNER/commercial-fusion-assembly-harness#v0.1.0" -- commercial-fusion-harness update my-project
```

`update` refreshes whichever layouts are already installed unless `--agent` is given. The installer copies only the canonical entries in `template/.agents/harness-manifest.json`. It does not install credentials, Fusion MCP configuration, Beads databases, or project-specific design files.

## Contents

- `template/.agents/skills/` - Fusion design, printed-part authoring, physical fit-up, BOM, availability, custom-versus-standard, and assembly-manual workflows.
- `template/.agents/subagents/` - independent audit/research prompts (installed as `.claude/agents/` for Claude Code).
- `template/.agents/commands/` - repeatable orchestration recipes.
- `bin/commercial-fusion-harness.mjs` - dependency-free installer/updater.

The template is the single source for both runtimes; the installer maps it to each runtime's directory layout at install time. Skills refer to each other as `$skill-name` (Codex mention syntax); in Claude Code that names the skill of the same name. Fusion MCP tools are named without a client prefix (`fusion_mcp_read`, `fusion_mcp_execute`), because the prefix depends on how the client names the MCP server.
