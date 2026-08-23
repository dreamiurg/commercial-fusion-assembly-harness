# Commercial Fusion Assembly Harness

Generic Codex skills, subagent prompts, and repeatable commands for designing and verifying mechanical assemblies made from commercially available parts with Fusion.

## Git-hosted installation

This repository is intended to be consumed directly from GitHub; it does not need to be published to npm.

```powershell
npx --yes --package="github:OWNER/commercial-fusion-assembly-harness#v0.1.0" -- commercial-fusion-harness init my-project
```

To refresh an existing project without replacing unrelated files:

```powershell
npx --yes --package="github:OWNER/commercial-fusion-assembly-harness#v0.1.0" -- commercial-fusion-harness update my-project
```

The installer copies only the canonical entries in `template/.agents/harness-manifest.json`. It does not install credentials, Fusion MCP configuration, Beads databases, or project-specific design files.

## Contents

- `template/.agents/skills/` - Fusion design, physical fit-up, BOM, availability, custom-versus-standard, and assembly-manual workflows.
- `template/.agents/subagents/` - independent audit/research prompts.
- `template/.agents/commands/` - repeatable orchestration recipes.
- `bin/commercial-fusion-harness.mjs` - dependency-free installer/updater.
