# Laju Framework Development Guidelines

## Project Overview

**Framework**: Laju - High-performance TypeScript web framework
**Technology Stack**: HyperExpress + Svelte 5 + Inertia.js + BetterSQLite3 + Knex
**Architecture**: MVC pattern with service layer
**Build Tools**: Vite (frontend), TypeScript compiler (backend)
**Styling**: TailwindCSS with dark mode support

## Project Structure Rules

### Core Directories
- **NEVER** modify files in `/build/` or `/dist/` - these are generated
- **ALWAYS** work in source directories: `/app/`, `/resources/`, `/routes/`
- **REQUIRED**: Place controllers in `/app/controllers/`
- **REQUIRED**: Place middlewares in `/app/middlewares/`
- **REQUIRED**: Place services in `/app/services/`
- **REQUIRED**: Place views in `/resources/views/`
- **REQUIRED**: Place frontend assets in `/resources/js/`

### File Naming Conventions
- Controllers: `PascalCase` + `Controller.ts` (e.g., `UserController.ts`)
- Middlewares: `camelCase.ts` (e.g., `auth.ts`)
- Services: `PascalCase.ts` (e.g., `DB.ts`)
- Views: `kebab-case.html` or `PascalCase.svelte`
- Routes: `web.ts` (main routing file)

## Controller Development Standards

### Controller Structure
```typescript
// REQUIRED pattern for all controllers
import { Response, Request } from "../../type";

class ControllerName {
    public async methodName(request: Request, response: Response) {
        // Implementation
    }
}

export default new ControllerName();
```

### Controller Rules
- **MUST** use class-based structure with async methods
- **MUST** export new instance, not the class
- **MUST** import Request/Response types from "../../type"
- **MUST** use async/await for database operations
- **NEVER** use arrow functions for controller methods

## Middleware Development Standards

### Middleware Structure
```typescript
// REQUIRED pattern for all middlewares
import { Request, Response } from "../../type";

export default async (request: Request, response: Response) => {
    // Middleware logic
};
```

### Middleware Rules
- **MUST** use function export default pattern
- **MUST** be async functions
- **MUST** handle authentication via cookies (auth_id)
- **MUST** set request.user and request.share for authenticated users
- **MUST** redirect to /login for unauthenticated access

## Service Development Standards

### Service Rules
- **MUST** use singleton pattern for services
- **MUST** handle environment-specific configurations
- **REQUIRED**: Import services in server.ts for initialization
- **NEVER** instantiate services multiple times

### Database Service Usage
- **ALWAYS** import DB from "../services/DB"
- **MUST** use Knex query builder syntax
- **REQUIRED**: Use BetterSQLite3 for both development and production
- **MUST** handle database errors in controllers

## Frontend Development Standards

### Svelte Component Rules
- **MUST** place components in `/resources/js/Pages/`
- **MUST** use Svelte 5 syntax and features
- **MUST** integrate with Inertia.js for page components
- **REQUIRED**: Support dark mode with Tailwind classes

### Asset Handling Rules
- **NEVER** directly reference `/dist/assets/` in development
- **MUST** use Vite dev server URLs in development mode
- **REQUIRED**: Handle both `/assets/` (compiled) and public static files
- **MUST** implement proper caching headers for production assets

### View Template Rules
- **MUST** use Squirrelly template engine for HTML views
- **REQUIRED**: Support hot reloading in development
- **MUST** handle asset path transformation for Vite integration
- **NEVER** hardcode asset paths in templates

## Routing Standards

### Route Organization
- **MUST** document route groups with comments
- **REQUIRED** sections: Public Routes, Authentication Routes, Protected Routes, Asset Routes
- **MUST** place asset routes LAST in routing file
- **REQUIRED**: Use middleware arrays for protected routes: `[Auth]`

### Route Documentation Format
```typescript
/**
 * Route Group Name
 * Description of route group purpose
 * ------------------------------------------------
 * METHOD /path - Description
 */
```

## Authentication System Rules

### Authentication Flow
- **MUST** use cookie-based sessions (auth_id)
- **REQUIRED**: Store sessions in database with user_id reference
- **MUST** support Google OAuth integration
- **REQUIRED**: Implement password reset with tokens
- **MUST** verify email addresses for new registrations

### User Data Handling
- **ALWAYS** select specific fields: `["id","name","email","phone","is_admin","is_verified"]`
- **NEVER** expose password fields in user queries
- **MUST** set request.user for authenticated requests
- **REQUIRED**: Share user data via request.share for templates

## Database Migration Rules

### Migration Standards
- **MUST** use Knex migration format
- **REQUIRED**: Place migrations in `/migrations/` directory
- **MUST** use timestamp prefix for migration files
- **NEVER** modify existing migrations after deployment

### Database Configuration
- **REQUIRED**: Use `better-sqlite3` client for both environments
- **MUST** set `useNullAsDefault: true` for SQLite compatibility
- **REQUIRED**: Separate database files for development/production

## CLI Command Standards

### Command Structure
- **MUST** place commands in `/commands/native/`
- **REQUIRED**: Export object with `commandName` and `run` method
- **MUST** handle command arguments via `args` property
- **REQUIRED**: Use dynamic import loading in `/commands/index.ts`

### Available Commands
- `make:controller ControllerName` - Creates new controller
- `make:command CommandName` - Creates new CLI command

## Environment Configuration Rules

### Development vs Production
- **MUST** use `process.env.NODE_ENV` for environment detection
- **REQUIRED**: Different asset serving for development (Vite) vs production (static)
- **MUST** enable hot reloading only in development
- **REQUIRED**: Use different database files per environment

### Required Environment Variables
- `PORT` - Server port (default: 5555)
- `VITE_PORT` - Vite dev server port (default: 3000)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NODE_ENV` - Environment mode (development/production)

## Asset Management Rules

### Static Asset Handling
- **MUST** serve compiled assets from `/assets/:file` route
- **REQUIRED**: Serve public files from `/*` catch-all route
- **MUST** implement security checks for file extensions
- **REQUIRED**: Set proper cache headers for performance

### Allowed File Extensions
- Images: `.ico, .png, .jpeg, .jpg, .gif, .svg`
- Documents: `.txt, .pdf`
- Fonts: `.woff, .woff2, .ttf, .eot`
- Media: `.mp4, .webm, .mp3, .wav`
- Web: `.css, .js`

## Build and Deployment Rules

### Development Workflow
- **NEVER** run build commands during development
- **REQUIRED**: Use `npm run dev` for development server
- **MUST** rely on hot reloading for changes
- **NEVER** modify files in build directories

### Production Build
- **REQUIRED**: Run `npm run build` for production
- **MUST** compile TypeScript to `/build/` directory
- **REQUIRED**: Build frontend assets to `/dist/`
- **MUST** copy public files to build directory

## Error Handling Standards

### Server Error Handling
- **MUST** implement global error handler in server.ts
- **REQUIRED**: Handle SQLITE_ERROR specifically
- **MUST** log errors to console
- **REQUIRED**: Return JSON error responses

### Controller Error Handling
- **MUST** use try-catch blocks for database operations
- **REQUIRED**: Return appropriate HTTP status codes
- **MUST** handle validation errors gracefully

## Security Standards

### Authentication Security
- **MUST** validate session tokens on protected routes
- **REQUIRED**: Clear invalid cookies and redirect to login
- **MUST** implement CSRF protection for forms
- **NEVER** expose sensitive user data in responses

### File Security
- **MUST** validate file extensions for uploads
- **REQUIRED**: Prevent directory traversal attacks
- **NEVER** serve files outside allowed directories

## AI Agent Decision Standards

### File Modification Priority
1. **Controllers** - Modify for business logic changes
2. **Routes** - Update for new endpoints or middleware
3. **Views** - Change for UI/template updates
4. **Services** - Modify for shared functionality
5. **Middlewares** - Update for cross-cutting concerns

### Multi-file Coordination Requirements
- **WHEN** adding new controller → **MUST** update routes/web.ts
- **WHEN** adding authentication → **MUST** update middleware and routes
- **WHEN** adding new pages → **MUST** create both controller method and view
- **WHEN** modifying database → **MUST** create migration file

## Prohibited Actions

### Strictly Forbidden
- **NEVER** modify files in `/build/` or `/dist/` directories
- **NEVER** start or restart the development server (hot reload handles changes)
- **NEVER** use production build files during development
- **NEVER** hardcode environment-specific values
- **NEVER** expose database credentials or secrets
- **NEVER** modify existing migration files
- **NEVER** use synchronous file operations in request handlers
- **NEVER** bypass authentication middleware for protected routes

### Development Restrictions
- **AVOID** creating new services without singleton pattern
- **AVOID** direct database queries without Knex
- **AVOID** inline styles (use TailwindCSS classes)
- **AVOID** client-side routing (use Inertia.js navigation)

## Code Quality Standards

### TypeScript Usage
- **MUST** use proper type definitions from `/type/index.d.ts`
- **REQUIRED**: Import Request/Response types consistently
- **MUST** handle async operations with proper typing
- **NEVER** use `any` type without justification

### Code Organization
- **MUST** follow single responsibility principle
- **REQUIRED**: Separate business logic from presentation
- **MUST** use consistent naming conventions
- **REQUIRED**: Document complex business logic with comments