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

## 🌐 How to Deploy This as a Live Website

Because this is a standard React + Vite client-side app, you can host it for free on any modern web platform in minutes:

### Option 1: Vercel (Recommended - Instant & Free)
1. Push this folder to a GitHub repository (or run `npx vercel` in this folder).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects the project using `vercel.json` (`npm run build`, output directory `dist`).
5. Click **Deploy**. You will get a free live URL (e.g. `your-app.vercel.app`) and can connect your own custom domain.

---

### Option 2: Netlify (Drag & Drop or Git - Free)
**Method A — Drag & Drop (No Git needed):**
1. Run `npm run build` locally. This creates the production `dist/` folder.
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop your `dist/` folder directly onto the page.
4. Your website is instantly live!

**Method B — Git:**
1. Connect your repository on [netlify.com](https://netlify.com).
2. The included `netlify.toml` automatically configures the build (`npm run build`, publish directory `dist`).

---

### Option 3: GitHub Pages (Free)
1. Push your code to a GitHub repository.
2. In GitHub, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **GitHub Actions**.
4. Select the **Static HTML** or **Vite** starter workflow to deploy `dist/` automatically on every git push.

---

### Option 4: Cloudflare Pages (Free)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) > **Workers & Pages** > **Create application** > **Pages**.
2. Connect your Git repository.
3. Set build command to `npm run build` and output directory to `dist`.
4. Click **Save and Deploy**.

---

### Option 5: Self-Hosted Server / VPS / Docker
1. Run `npm run build` to generate the static files in `dist/`.
2. Serve the `dist/` folder with Nginx, Caddy, Apache, or a simple Node server:
   ```bash
   npx serve dist -p 80
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
