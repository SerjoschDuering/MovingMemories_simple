# CLAUDE.md - Critical Project Information

## 🚨 CRITICAL: TAILWIND CSS v4 CONFIGURATION 🚨

### ⚠️ ALWAYS CHECK TAILWIND v4 API DOCS FIRST! ⚠️
**Before making ANY changes to Tailwind configuration, PostCSS, or CSS files:**
1. **CHECK THE OFFICIAL TAILWIND v4 DOCUMENTATION** at https://tailwindcss.com/docs
2. **VERIFY THE API CHANGES** - Tailwind v4 has BREAKING CHANGES from v3

### Known Issues & Solutions (DO NOT WASTE TIME ON THESE AGAIN)

#### PostCSS Plugin Configuration (FIXED - DO NOT CHANGE)
**THE PROBLEM WE SPENT AN HOUR ON:**
- Error: `[plugin:vite:css] [postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin`
- **CAUSE:** Tailwind v4 moved PostCSS support to a separate package `@tailwindcss/postcss`
- **SOLUTION:** The PostCSS config MUST use `"@tailwindcss/postcss": {}` NOT `tailwindcss: {}`

**WORKING CONFIGURATION:**
```javascript
// postcss.config.js - DO NOT CHANGE THIS
export default {
  plugins: {
    "@tailwindcss/postcss": {},  // ← MUST BE @tailwindcss/postcss, NOT tailwindcss
    autoprefixer: {},
  },
}
```

#### CSS Import (WORKING - DO NOT CHANGE)
```css
/* src/index.css */
@import "tailwindcss";  // ← Tailwind v4 style
```

#### Required Packages
- `tailwindcss` (v4.x)
- `@tailwindcss/postcss` (for PostCSS integration)
- `@tailwindcss/vite` (optional, for Vite plugin approach)
- `autoprefixer`
- `postcss`

### ⚠️ BEFORE TOUCHING TAILWIND CONFIG ⚠️
1. **ALWAYS CHECK TAILWIND v4 DOCS FIRST** - The API has changed significantly
2. **DO NOT** assume v3 patterns work in v4
3. **DO NOT** use `tailwindcss` as a PostCSS plugin directly
4. **DO NOT** change the working PostCSS configuration above

### If Tailwind Stops Working
1. Check `postcss.config.js` has `"@tailwindcss/postcss": {}`
2. Clear Vite cache: `rm -rf node_modules/.vite .vite`
3. Kill all dev servers: `pkill -f vite`
4. Restart: `npm run dev`

## Project Setup

### Technology Stack
- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS v4 (with PostCSS)
- **State Management:** Zustand
- **Backend:** Express.js
- **Database:** SQLite with better-sqlite3

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Project Structure
```
moving-memories/
├── src/
│   ├── components/     # React components
│   ├── styles/         # CSS files
│   ├── store/          # Zustand store
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── server/             # Express backend
├── postcss.config.js   # DO NOT MODIFY without checking Tailwind v4 docs
├── tailwind.config.js  # Tailwind configuration
└── vite.config.ts      # Vite configuration
```

---
**REMEMBER:** Always check Tailwind v4 documentation before making CSS/PostCSS changes!