---
name: AfraLink tsconfig references gotcha
description: Which lib packages can be in afralink tsconfig references and which cannot
---

## Rule

Only composite libs (those with `"composite": true` in their tsconfig) can be listed in the `references` array of `artifacts/afralink/tsconfig.json`.

`lib/replit-auth-web` and `lib/object-storage-web` are NOT composite — do not add them to references or TS6306 errors appear.

Currently only `lib/api-client-react` is composite and safe to reference.

**Why:** TypeScript project references require the referenced project to be composite (emit declarations). Non-composite libs are still usable via moduleResolution without explicit references.

**How to apply:** Before adding a lib to afralink tsconfig references, check that its tsconfig.json has `"composite": true`.
