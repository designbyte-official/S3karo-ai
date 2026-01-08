# S3-Karo Project Structure

This document outlines the project structure and organization principles for S3-Karo.

## Directory Structure

```
s3-karo/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes (grouped)
│   ├── (private)/              # Private routes (grouped)
│   ├── (primary)/              # Primary routes (grouped)
│   └── api/                    # API routes
│       ├── auth/               # Authentication endpoints
│       ├── files/              # File management endpoints
│       ├── upload/             # Upload endpoints
│       ├── v1/                 # Public API v1
│       └── ...
├── components/                   # React components
│   ├── common/                 # Shared/common components
│   ├── form-inputs/            # Form input components
│   ├── layout/                 # Layout components
│   ├── ui/                     # UI primitives (shadcn)
│   └── wrappers/               # Wrapper components
├── features/                     # Feature-based modules
│   ├── auth/                   # Authentication feature
│   │   ├── actions/            # Server actions
│   │   ├── components/         # Feature components
│   │   ├── hooks/              # Feature hooks
│   │   ├── services/           # Feature services
│   │   ├── stores/             # Feature stores
│   │   └── types/              # Feature types
│   ├── managed-storage/        # Platform-managed storage
│   ├── private-s3/             # Private S3 integration
│   └── shared/                 # Shared utilities
├── lib/                          # Core libraries
│   ├── auth/                   # Authentication utilities
│   ├── database/               # Database layer
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── queries.ts          # Database queries
│   │   ├── db.ts               # Database connection
│   │   └── migrate.ts          # Migrations
│   ├── email/                  # Email utilities
│   └── utils/                  # General utilities
├── docs/                         # Public documentation
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture docs
│   └── ...
├── local-docs/                   # Internal documentation
├── public/                       # Static assets
└── types/                        # TypeScript type definitions
```

## Architecture Principles

### 1. Feature-Based Organization

- Each feature is self-contained in `features/`
- Features include: components, hooks, services, stores, types
- Promotes modularity and maintainability

### 2. Separation of Concerns

- **Components**: UI presentation
- **Services**: Business logic and API calls
- **Hooks**: Reusable stateful logic
- **Stores**: Global state management (Zustand)
- **Types**: TypeScript definitions

### 3. API Organization

- `/api/auth/*` - Authentication endpoints
- `/api/files/*` - File management (internal)
- `/api/upload/*` - Upload endpoints
- `/api/v1/*` - Public API (versioned)

### 4. Database Layer

- `schema.ts` - Drizzle ORM schema definitions
- `queries.ts` - Database query functions
- `db.ts` - Database connection and configuration
- `migrate.ts` - Migration utilities

## Naming Conventions

- **Files**: kebab-case (`user-actions.ts`, `file-list.tsx`)
- **Components**: PascalCase (`FileList.tsx`, `UserProfile.tsx`)
- **Functions**: camelCase (`getUserById`, `createFile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`User`, `FileMetadata`)

## Best Practices

1. **Imports**: Always at the top of files, no dynamic imports in functions
2. **Error Handling**: Use try-catch blocks, return meaningful error messages
3. **Type Safety**: Use TypeScript strictly, avoid `any` types
4. **Documentation**: Add JSDoc comments for public functions
5. **Testing**: Write tests for critical business logic
6. **Code Organization**: Keep files focused, single responsibility principle

## File Organization Rules

- One component per file
- Related utilities grouped in same directory
- Shared code in `features/shared/` or `lib/`
- Feature-specific code in respective `features/*/` directory
