# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PediClick is a React-based inventory management and e-commerce application built with TypeScript, Vite, and Supabase. The application supports two modes:
- **Admin mode** (default): Full-featured inventory management system with authentication, stock control, orders, and analytics
- **Client mode** (disabled): Public-facing e-commerce interface (controlled by `isInClientMode` flag in App.tsx)

## Development Commands

```bash
# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Dual-Mode Application

The app conditionally renders either admin or client interfaces based on `isInClientMode` (currently hardcoded to `false` in App.tsx). In the future, this will switch based on subdomain detection.

### Routing & Authentication

- **Public routes**: `/`, `/sign-in`, `/sign-up`, `/forgot-password` (defined in `PUBLIC_ROUTES`)
- **Protected routes**: All admin routes require authentication via `RequireAuth` component
- **Role-based access**: Further protected by `RolesAuth` component for admin-only features
- Routes are defined in `src/App.tsx` using react-router-dom v6

### State Management

The application uses multiple state management approaches:
- **Redux Toolkit** (`src/stores/store.ts`): User state only (via `userSlice`)
- **React Query** (TanStack Query): Server state, data fetching, and caching
- **Context API**:
  - `LocationsContext`: Provides location data throughout admin interface
  - `CartContext`: Client-mode shopping cart state
  - `SearchContext`: Client-mode search functionality

### Data Layer

**Service Layer** (`src/service/`):
- Each entity has its own service file (e.g., `products.tsx`, `stock.tsx`, `orders.tsx`)
- Services interact directly with Supabase client
- `src/service/index.tsx` exports the Supabase client and common utilities

**Adapters** (`src/adapters/`):
- Transform data between database format and client format
- Example: `adaptProductForDb()` and `adaptProductsForClient()` in `src/adapters/products.tsx`
- Use adapters when the database schema differs from the UI requirements

**Types** (`src/types/`):
- TypeScript interfaces for all entities
- Organized by feature (e.g., `products.tsx`, `orders.tsx`, `stocks.tsx`)

### Component Organization

**Admin Components** (`src/components/admin/`):
- Reusable admin-specific components
- Notable subdirectories:
  - `selectors/`: Dropdown selectors for various entities (products, clients, locations, etc.)
  - `pricesManagement.tsx/`: Complex price management UI
  - `stock/`: Stock-related reusable components
  - `header/`, `sidebar/`: Admin layout components

**Client Components** (`src/components/clients/`):
- E-commerce interface components (currently disabled)
- CSS Modules used for styling (e.g., `Item.module.css`)

**UI Components** (`src/components/ui/`):
- shadcn/ui components (styled with Tailwind CSS)
- Based on Radix UI primitives
- Use `npx shadcn@latest add <component>` to add new components

### Page Structure

**Admin Pages** (`src/pages/admin/`):
- Each major feature has its own page directory
- Common pattern: Container components handle data fetching, presentation components handle UI
- Example: `stock/components/ProductsContainer.tsx` (data) + `productTableRenderer.tsx` (UI)

Key admin sections:
- `auth/`: Sign in, sign up, password reset
- `stock/`: Main inventory management interface
- `loadOrders/`, `transferOrders/`: Order management
- `lotContainers/`: Lot-based inventory tracking
- `clients/`: Customer management
- `dashboard/`: Analytics and reports
- `settings/`: Application configuration

### Styling

- **Tailwind CSS v4**: Primary styling approach
- **CSS Modules**: Used in client-facing components for scoped styles
- **shadcn/ui**: Pre-styled component library with customization via `components.json`
- Path alias `@/` resolves to `src/`

## Key Patterns

### Authentication Flow

1. User session checked via `useUserSession()` hook
2. `RequireAuth` component guards protected routes
3. `RolesAuth` provides additional role-based protection
4. Supabase handles authentication state

### Data Fetching Pattern

```typescript
// Use React Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ["entity-name", id],
  queryFn: async () => {
    const response = await serviceFunction();
    return response.data;
  },
});
```

### Form Validation

- **Zod** schemas in `src/validator/` (e.g., `products.tsx`, `teamMembers.tsx`)
- **react-hook-form** for form state management
- Pattern: Define Zod schema → infer TypeScript types → validate in forms

## Environment Setup

Required environment variables (create `.env` from `.env_example`):
```
VITE_APP_SUPABASE_URL=your-supabase-url
VITE_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Important Conventions

- Use adapters when transforming data between database and UI formats
- Keep service functions pure - they should only handle data fetching/mutations
- Container/presentation pattern: separate data fetching from UI rendering
- React Query for all server state - avoid storing server data in Redux
- Use existing selector components (`src/components/admin/selectors/`) for entity selection
- File naming: PascalCase for components, camelCase for utilities/hooks

## Files Marked UNUSED

Many files contain `UNUSED` suffix or are in directories marked `UNUSED`. These represent deprecated or experimental code that may be refactored or removed. Check with the team before modifying these files.

## Deployment

- Deployed to Vercel (configuration in `vercel.json`)
- Build output directory: `dist/`
- Base path: `/`
