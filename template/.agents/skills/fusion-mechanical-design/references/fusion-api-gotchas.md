# Fusion API gotchas for MCP scripts

Observed through the Fusion MCP `fusion_mcp_execute` tool (September 2026). Re-check against the current Fusion release when behaviour looks different.

## Running a script

- The executed script must define `run(context)`; module-level code alone does not run as expected.
- To keep a script in the repository and run it unchanged, execute a small loader. `SRC` is an absolute path on the machine running Fusion:

  ```python
  SRC = "/abs/path/to/part_fusion.py"

  def run(context):
      ns = {"__name__": "part_fusion", "__file__": SRC}
      exec(compile(open(SRC).read(), SRC, "exec"), ns)
      ns["run"](context)
  ```

- API lengths are centimetres, not millimetres. Convert at one boundary (`m(v) = v / 10` in, `* 10` out) and keep every constant in the script in millimetres.

## Geometry

- A Part Design document holds only one component ("Part Design documents can only contain one component"). Model several parts as named bodies in the root component. Add each `TemporaryBRepManager` body through its own base feature (`baseFeatures.add()`, `startEdit()`, `rootComponent.bRepBodies.add(body, feature)`, `finishEdit()`), then name the feature and the body.
- `TemporaryBRepManager.createTorus(center, axis, majorRadius, minorRadius)` ignored the center point: the torus was built at the origin, which caused a silent 3760 mm^3 overlap. Build it at the origin and move it with `tbm.transform(body, matrix3d)`.
- Interference between temporary bodies: copy both, intersect them with `booleanOperation(..., IntersectionBooleanType)`, and read `volume` (cm^3, so `* 1000` for mm^3). This is a reliable scripted check; treat anything above about `1e-3` mm^3 as a real overlap.

## Imports

- Importing a large vendor STEP (24 MB) with `importManager.importToTarget` failed with `InternalValidationError`. Workaround: extract the needed part positions offline (for example with build123d/OCP), then model simple reference envelopes in Fusion and record the STEP as their source.

## Projects, saving, and uploads

- With no active project, `app.data.activeProject` is unusable. Find or create one through `app.data.dataProjects` (`dataProjects.add(name)`), then use its `rootFolder`.
- Save a new document with `doc.saveAs(name, folder, description, tag)`; upload exported files (for example STLs) with `folder.uploadFile(path)`.
- Saving and uploading change the user's cloud data. Do both only when the user has explicitly asked for it.
