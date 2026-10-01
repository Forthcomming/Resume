# REDcowork Source Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a source-only ZIP that REDcowork can unpack from its root and build with Node 20.

**Architecture:** Keep the existing Vite application unchanged except for pinning the PDF parser to a Node 20-compatible release. Assemble the archive from an explicit allowlist so local dependencies, build output, tests, caches, secrets, and nested project directories cannot enter the package.

**Tech Stack:** Vite 5, React 18, TypeScript, npm lockfile v3, PowerShell/.NET ZIP APIs, Node 20 verification runtime.

## Global Constraints

- ZIP root contains `package.json`; there is no enclosing `redcowork-demo/` directory.
- Output is `output/resumekit-redcowork-source.zip` and must remain below 50 MB.
- Runtime compatibility target is Node 20.
- `unpdf` is fixed to `1.7.0`; the lockfile must resolve the same version.
- Exclude `node_modules/`, `dist/`, test files, `*.tsbuildinfo`, generated Vite config output, environment files, and secrets.
- Do not change Demo functionality, routes, UI, or local data structures.

---

### Task 1: Pin the Node 20-Compatible PDF Parser

**Files:**
- Modify: `redcowork-demo/package.json`
- Modify: `redcowork-demo/package-lock.json`

**Interfaces:**
- Consumes: Existing `unpdf` browser import API.
- Produces: An npm dependency graph resolving exactly `unpdf@1.7.0`.

- [ ] **Step 1: Change the dependency declaration**

Set the production dependency to:

```json
"unpdf": "1.7.0"
```

- [ ] **Step 2: Regenerate only the npm lockfile**

Run:

```powershell
npm install --package-lock-only --ignore-scripts
```

- [ ] **Step 3: Verify the resolved version and Node 20 dependency constraints**

Run:

```powershell
npm ls unpdf
npm run build
```

Expected: `unpdf@1.7.0` and a successful Vite build.

### Task 2: Assemble the Source-Only ZIP

**Files:**
- Create: `output/resumekit-redcowork-source.zip`

**Interfaces:**
- Consumes: Production source and build configuration from `redcowork-demo/`.
- Produces: A standard unencrypted ZIP with project files at archive root.

- [ ] **Step 1: Copy the allowlisted root files to a fresh staging directory**

Include exactly `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, and `README.md`.

- [ ] **Step 2: Copy production source without tests**

Copy `src/` and omit `*.test.ts` and `*.test.tsx`.

- [ ] **Step 3: Create the archive from staging contents**

Use the .NET ZIP API so the first archive level contains `package.json` and `src/` directly.

- [ ] **Step 4: Inspect the archive manifest**

Expected: no entries matching `node_modules/`, `dist/`, `.env`, `*.tsbuildinfo`, `*.test.ts`, `vite.config.js`, or `vite.config.d.ts`.

### Task 3: Verify the Delivered Archive Under Node 20

**Files:**
- Read: `output/resumekit-redcowork-source.zip`

**Interfaces:**
- Consumes: The final ZIP from Task 2.
- Produces: Evidence that REDcowork can unpack the archive and build the project with Node 20.

- [ ] **Step 1: Extract into a new isolated verification directory**

Confirm `package.json` exists directly in the extraction root.

- [ ] **Step 2: Install and build using Node 20**

Run with a temporary Node 20 runtime:

```powershell
npx -y -p node@20.19.5 -c "node --version && npm ci && npm run build"
```

Expected: Node reports `v20.19.5`, installation completes, and Vite creates `dist/index.html`.

- [ ] **Step 3: Report artifact metadata**

Report the absolute ZIP path, byte size, SHA-256 digest, root-entry check, resolved `unpdf` version, and build result.
