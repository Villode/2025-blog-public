# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 16 personal blog platform with a unique architecture: it uses GitHub as a CMS backend. Content is managed through GitHub App integration, allowing users to create, edit, and publish blog posts directly from the frontend, which then commits changes back to the repository.

Key technologies: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Zustand, Shiki, Marked, pnpm.

## Common Commands

### Development
```powershell
pnpm i                    # Install dependencies
pnpm dev                  # Start dev server on port 2025
pnpm build                # Build for production (uses Turbopack)
pnpm start                # Start production server
```

### Code Quality
```powershell
pnpm format               # Format code with Prettier
```

### Asset Management
```powershell
pnpm svg                  # Generate SVG index (runs scripts/gen-svgs-index.js)
```

## Architecture

### GitHub Integration (Core Feature)

The application uses GitHub App authentication to manage content:

1. **Authentication Flow** (`src/lib/auth.ts`, `src/lib/github-client.ts`):
   - User provides GitHub App Private Key (`.pem` file)
   - App signs JWT using `jsrsasign` library
   - Obtains installation token from GitHub API
   - Token is cached in sessionStorage for the session

2. **Content Management**:
   - All content operations use GitHub Contents API
   - Supports single file updates (`putFile`) and batch commits (`createTree`, `createCommit`, `updateRef`)
   - Blog index automatically maintained at `public/blogs/index.json`

### Content Structure

**Blog Posts** (`public/blogs/[slug]/`):
- Each blog lives in its own directory: `public/blogs/{slug}/`
- `index.md` - Markdown content
- `config.json` - Metadata (title, tags, date, summary, cover)
- Images stored in same directory

**Blog Index** (`public/blogs/index.json`):
- Central index of all blog metadata
- Auto-updated when publishing/deleting posts
- Sorted by date (newest first)
- Used by `useBlogIndex()` hook for listing

**Site Configuration** (`src/config/site-content.json`):
- Site metadata (title, description)
- Theme colors (brand, primary, secondary, background, border, card, article)
- Background colors for animated bubbles
- Art images configuration

### State Management

**Zustand Stores** (prefer over Context API):
- `useAuthStore` (`src/hooks/use-auth.ts`) - GitHub private key management
- `useConfigStore` (`src/app/(home)/stores/config-store.ts`) - Site content and card layout/styles
- `useLayoutEditStore` (`src/app/(home)/stores/layout-edit-store.ts`) - Homepage drag-and-drop editing
- `useSizeStore` (`src/hooks/use-size.ts`) - Responsive breakpoints
- `useCenterStore` (`src/hooks/use-center.ts`) - Viewport center calculations for card positioning
- `useWriteStore` (`src/app/write/stores/write-store.ts`) - Blog editor state

### App Router Structure

```
src/app/
├── (home)/          # Homepage with card-based layout
├── blog/            # Blog listing and individual posts
│   └── [id]/        # Dynamic blog post pages
├── write/           # Blog editor (create/edit)
│   └── [id]/        # Edit existing blog
├── about/           # About page
├── bloggers/        # Featured bloggers
├── pictures/        # Image gallery
├── projects/        # Projects showcase
├── share/           # Shared links/resources
└── rss.xml/         # RSS feed route
```

### Card-Based Homepage

The homepage uses a unique card positioning system:
- Cards are positioned absolutely based on viewport center (`useCenterStore`)
- Each card has configurable `offsetX`, `offsetY`, `width`, `height`, and `order` (z-index)
- `HomeDraggableLayer` component enables drag-and-drop repositioning in edit mode
- Layout configuration stored in `useConfigStore` and persisted to `site-content.json`

### Markdown Rendering

Custom markdown pipeline (`src/lib/markdown-renderer.ts`, `src/hooks/use-markdown-render.tsx`):
1. Parse with `marked` library
2. Syntax highlighting with `shiki` (supports multiple themes)
3. Custom image handling (local paths, dimensions)
4. Custom heading anchors
5. Returns React elements via `html-react-parser`

## Key Patterns

### Publishing Flow
1. User creates/edits blog in `/write` page
2. Provides GitHub App private key (stored in memory only)
3. Clicks publish → triggers `usePublish().onPublish()`
4. Service layer (`src/app/write/services/push-blog.ts`):
   - Uploads images as blobs
   - Creates markdown file
   - Creates/updates config.json
   - Updates blog index
   - Commits all changes in single atomic operation
5. Vercel auto-deploys on push to main branch

### Services Pattern
Each feature area has a `services/` directory with functions that:
- Accept auth token as first parameter
- Use `src/lib/github-client.ts` helpers
- Handle GitHub API interactions
- Return promises

Example: `src/app/blog/services/batch-delete-blogs.ts`

### Component Organization
- Feature-specific components: `src/app/[feature]/components/`
- Shared components: `src/components/`
- Each major feature (write, blog, projects, etc.) is self-contained

### Reading Articles Tracking
- `useReadArticles` hook tracks which posts user has read
- Stored in localStorage as array of slugs
- Used to show unread indicators in blog listings

## Environment Variables

Set these in Vercel or `.env.local`:

```bash
NEXT_PUBLIC_GITHUB_OWNER    # GitHub username (default: 'yysuni')
NEXT_PUBLIC_GITHUB_REPO     # Repository name (default: '2025-blog-public')
NEXT_PUBLIC_GITHUB_BRANCH   # Branch name (default: 'main')
NEXT_PUBLIC_GITHUB_APP_ID   # GitHub App ID (required for publishing)
```

Alternatively, modify `src/consts.ts` directly (since repo is public).

## Important Notes

- **TypeScript**: `ignoreBuildErrors: true` in `next.config.ts` - fix type errors when adding features
- **React Compiler**: Enabled in config (`reactCompiler: true`)
- **Turbopack**: Used for both dev and build
- **SVG Handling**: SVGs imported as React components via `@svgr/webpack`
- **No SSR for some components**: `LiquidGrass` uses `dynamic(() => import(), { ssr: false })`
- **Private Key Security**: Never commit `.pem` files - they're used client-side only and stored in memory

## Styling

- **Tailwind CSS 4** with PostCSS
- **CSS Custom Properties** for theming (defined in `src/app/layout.tsx`):
  - `--color-brand`, `--color-primary`, `--color-secondary`, etc.
- **Motion** (Framer Motion) for animations
- Responsive: Uses custom breakpoint hooks (`useSize()`) instead of just CSS media queries

## Testing Blog Changes Locally

1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:2025/write`
3. Create test blog post
4. Upload your GitHub App private key when prompted
5. Publish - changes commit to your branch
6. View at `http://localhost:2025/blog/[your-slug]`

Note: After publishing, wait for Vercel deployment to see changes on production site.
