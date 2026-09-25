---
name: fusion-printed-part-authoring
description: Author 3D-printed custom parts that mate with commercial parts as a repository-kept Fusion script, rebuilt from scratch each run with built-in interference and assembly-path checks and one STL per body.
---

# Printed-part authoring in Fusion

Use this skill after `$custom-vs-standard` has chosen a custom printed part, or when the user asks for an enclosure, bracket, spacer, or adapter to be modelled. The script in the repository is the source of truth; the Fusion document is a rebuildable view of it. Editing a Fusion document changes the user's design, so work in a document the user has named for this purpose and do not save or upload without explicit authorization.

## Workflow

1. Fix the reference geometry first: the commercial parts the print must fit (board, cell, fasteners, connectors), each with its source (vendor STEP, drawing, or caliper measurement) and the coordinate frame. Model them as simple reference envelopes in the same script, named `... (reference)`.
2. Put every dimension at the top of the script as a named millimetre constant: reference geometry, fit clearances, wall and floor thicknesses, fastener sizes. Mark values that are not from an authoritative source as "verify".
3. Build each printed part as a function returning a body. Compose with boolean union/difference, and derive features from the constants rather than from hand-placed numbers.
4. Start every run by deleting what the previous run created (walk the timeline backwards and delete each entity), then rebuild. Never hand-edit the Fusion result; change the script and rerun.
5. Check before placing bodies: the pairwise intersection volume of every part against every other part and reference, every moving part at both ends of its travel, and the assembly path (a part must pass the outline of parts already installed as it is inserted). Print the result; any non-zero overlap is a failure to fix, not to report later.
6. Place each part as a named body through its own base feature, reference envelopes included, so the user can inspect the fit visually.
7. Export one STL per printed body (not the references), named after the body, into a project path the user chose.
8. Record print orientation for each part: the face on the bed, overhangs above about 45 degrees and whether they need support, thin walls against the nozzle width, holes that print better as teardrops or with a sacrificial bridge, and which features are fit-critical and should be test-printed first.

## Guardrails

- A clearance is a design decision; state the fit value used for each interface (for example 0.3 mm around a glass edge) and why.
- A printed part that carries load or clamps a commercial part needs its load path and fastener engagement checked with `$commercial-parts-bom`.
- Report interference with part names and volume in mm^3, and fix the geometry rather than moving references to make a check pass.
- Treat the first print as a fit test. Compare it with the model using `$physical-fitup` before calling the design done.

Read [fusion-api-gotchas.md](../fusion-mechanical-design/references/fusion-api-gotchas.md) before writing the script: the `run(context)` loader for repo-kept scripts, centimetre units, one-component Part Design documents, the `createTorus` center quirk, and the intersection-volume check.
