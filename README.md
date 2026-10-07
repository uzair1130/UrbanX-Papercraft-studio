# Interactive 3D Urban Resilience & Architecture CAD Studio

A Blender-grade papercraft and architectural CAD studio with real-time ray-traced lighting, modular snap assembly, texture mapping, history undo/redo, SimCity-style urban resilience simulator, and multi-format 3D export (OBJ, GLTF, STL, SVG nets).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (Node.js v20+ recommended)
- **npm**: v9+ (or **pnpm**, **yarn**, **bun**)

---

### Step 1: Install Dependencies
Open your terminal inside this unzipped folder and run:

```bash
npm install
```

*(Note: If you are using bun or pnpm, you can also run `bun install` or `pnpm install`)*

---

### Step 2: Start Development Server
Run either:

```bash
npm run dev
```
or
```bash
npm start
```

---

### Step 3: Open in Browser
Visit:
```
http://localhost:3000
```

---

## 🛠️ Available Scripts

- **`npm run dev`** / **`npm start`**: Runs the local development server on `http://localhost:3000`.
- **`npm run build`**: Builds the production bundle into the `dist/` directory.
- **`npm run preview`**: Previews the production build locally.
- **`npm run lint`**: Checks TypeScript types and project syntax.

---

## 🧩 Common Troubleshooting

1. **Port already in use**:
   If port 3000 is occupied by another application, Vite will automatically prompt or select port 3001. You can also specify a custom port:
   ```bash
   npm run dev -- --port 4000
   ```

2. **Clean install**:
   If you ever encounter package conflicts on older Node versions:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
