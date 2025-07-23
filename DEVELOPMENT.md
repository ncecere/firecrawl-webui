# Development Guide

This guide provides detailed information for developers working on the Firecrawl Frontend project.

## 🏗️ Architecture Overview

### Design Principles

1. **Type-First Development**: All data structures are defined with comprehensive TypeScript types
2. **Modular Architecture**: Code is organized into focused, reusable modules
3. **Separation of Concerns**: Clear boundaries between UI, business logic, and data management
4. **Performance Optimization**: Components are memoized and optimized for minimal re-renders
5. **Error Resilience**: Comprehensive error handling with graceful degradation

### Directory Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout
│   └── api/               # API routes
├── components/            # React components
│   ├── shared/            # Reusable components
│   ├── layout/            # Layout components
│   ├── jobs/              # Job management components
│   └── ui/                # Base UI components (shadcn/ui)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
├── constants/             # Application constants
└── config/                # Configuration files
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ 
- npm, pnpm, or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd firecrawl-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env.local` file:

```env
# Optional: Default API endpoint
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://api.firecrawl.dev

# Optional: Application settings
NEXT_PUBLIC_MAX_JOBS=100
NEXT_PUBLIC_STORAGE_LIMIT=10485760
```

## 📝 Coding Standards

### TypeScript Guidelines

1. **Strict Type Safety**: Use strict TypeScript configuration
2. **Interface Naming**: Use descriptive names without "I" prefix
3. **Type Exports**: Export types from centralized locations
4. **Generic Constraints**: Use appropriate generic constraints

```typescript
// ✅ Good
interface JobConfig {
  name: string
  timeout?: number
}

// ❌ Avoid
interface IJobConfig {
  name: any
  timeout: number | undefined
}
```

### React Component Guidelines

1. **Functional Components**: Use function components with hooks
2. **Memoization**: Use React.memo for performance optimization
3. **Props Interface**: Define clear props interfaces
4. **JSDoc Comments**: Document complex components

```typescript
/**
 * JobCard component displays individual job information
 * Memoized to prevent unnecessary re-renders
 */
export const JobCard = React.memo<JobCardProps>(({ job, onAction }) => {
  // Component implementation
})

JobCard.displayName = 'JobCard'
```

### Custom Hooks Guidelines

1. **Single Responsibility**: Each hook should have one clear purpose
2. **Return Objects**: Return objects instead of arrays for clarity
3. **Error Handling**: Include comprehensive error handling
4. **Cleanup**: Properly cleanup effects and subscriptions

```typescript
/**
 * Custom hook for managing job operations
 * @returns Object with job state and operations
 */
export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  
  // Implementation with proper cleanup
  useEffect(() => {
    const cleanup = setupJobPolling()
    return cleanup
  }, [])
  
  return { jobs, loading, addJob, removeJob, updateJob }
}
```

## 🧪 Testing Strategy

### Unit Testing

- Test utility functions in isolation
- Mock external dependencies
- Focus on business logic and edge cases

### Component Testing

- Test component rendering and interactions
- Mock complex dependencies
- Use React Testing Library patterns

### Integration Testing

- Test complete user workflows
- Test API integration points
- Verify error handling scenarios

## 🚀 Performance Guidelines

### Component Optimization

1. **React.memo**: Memoize components that receive stable props
2. **useMemo**: Memoize expensive calculations
3. **useCallback**: Memoize event handlers passed to child components
4. **Lazy Loading**: Use dynamic imports for large components

### State Management

1. **Local State**: Use useState for component-specific state
2. **Shared State**: Use custom hooks for shared logic
3. **Persistence**: Use localStorage with size limits and cleanup
4. **Polling**: Implement efficient polling with automatic cleanup

### Bundle Optimization

1. **Tree Shaking**: Import only needed functions from libraries
2. **Code Splitting**: Split large components and routes
3. **Asset Optimization**: Optimize images and static assets

## 🔍 Debugging

### Development Tools

1. **React DevTools**: Inspect component hierarchy and props
2. **TypeScript Compiler**: Use strict mode for better error detection
3. **ESLint**: Follow configured linting rules
4. **Browser DevTools**: Monitor network requests and performance

### Common Issues

1. **Type Errors**: Check import paths and type definitions
2. **Render Issues**: Verify component memoization and dependencies
3. **State Issues**: Check hook dependencies and cleanup
4. **API Issues**: Verify endpoint URLs and request formats

## 📦 Adding New Features

### 1. Define Types

Start by defining TypeScript types in the appropriate files:

```typescript
// types/newFeature.ts
export interface NewFeatureConfig {
  name: string
  options: FeatureOptions
}
```

### 2. Add Constants

Define any constants or default values:

```typescript
// constants/newFeatureDefaults.ts
export const NEW_FEATURE_DEFAULTS: NewFeatureConfig = {
  name: 'Default Feature',
  options: {}
}
```

### 3. Create Utilities

Add utility functions for the new feature:

```typescript
// lib/newFeatureUtils.ts
/**
 * Process new feature data
 * @param data - Raw feature data
 * @returns Processed feature result
 */
export function processFeatureData(data: unknown): FeatureResult {
  // Implementation
}
```

### 4. Build Hooks

Create custom hooks for state management:

```typescript
// hooks/useNewFeature.ts
export function useNewFeature() {
  // Hook implementation
  return { state, actions }
}
```

### 5. Create Components

Build UI components following established patterns:

```typescript
// components/newFeature/FeatureComponent.tsx
export const FeatureComponent = React.memo<FeatureProps>(({ ...props }) => {
  // Component implementation
})
```

### 6. Update API Routes

Add or modify API routes as needed:

```typescript
// app/api/newFeature/route.ts
export async function POST(request: NextRequest) {
  // API implementation
}
```

## 🔧 Build and Deployment

### Development Build

```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Docker Development

#### Development with Docker
```bash
# Start development environment with hot reloading
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f firecrawl-frontend

# Stop containers
docker-compose down
```

#### Production with Docker
```bash
# Build and run production container
docker-compose -f docker-compose.prod.yml up --build

# With custom environment variables
NEXT_PUBLIC_DEFAULT_API_ENDPOINT=https://your-api.com docker-compose -f docker-compose.prod.yml up --build

# Run with nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up
```

#### Docker Architecture

**Multi-stage Dockerfile:**
- **Stage 1 (deps)**: Install dependencies with pnpm
- **Stage 2 (builder)**: Build the Next.js application
- **Stage 3 (runner)**: Lightweight production runtime

**Key Features:**
- Non-root user for security
- Health checks for monitoring
- Optimized layer caching
- Standalone output for minimal image size

#### Docker Commands Reference
```bash
# Rebuild containers from scratch
docker-compose up --build --force-recreate

# Remove all containers and volumes
docker-compose down -v

# Build specific service
docker-compose build firecrawl-frontend

# Run commands inside container
docker-compose exec firecrawl-frontend npm run lint

# Check container health
docker-compose ps
```

### Production Considerations

1. **Environment Variables**: Set production environment variables
2. **Error Monitoring**: Configure error tracking
3. **Performance Monitoring**: Set up performance metrics
4. **Security**: Review security headers and configurations
5. **Docker Security**: Use non-root users, read-only filesystems, and minimal capabilities

## 🤝 Contributing

### Pull Request Process

1. **Branch Naming**: Use descriptive branch names (`feature/job-filtering`)
2. **Commit Messages**: Write clear, descriptive commit messages
3. **Code Review**: Ensure all code is reviewed before merging
4. **Testing**: Add tests for new features and bug fixes

### Code Quality Checklist

- [ ] TypeScript types are properly defined
- [ ] Components are memoized where appropriate
- [ ] JSDoc comments are added for complex functions
- [ ] Error handling is comprehensive
- [ ] Tests are written and passing
- [ ] ESLint rules are followed
- [ ] Performance impact is considered

## 📚 Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools

- [shadcn/ui Components](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

## 🐛 Troubleshooting

### Common Development Issues

1. **Module Resolution**: Check tsconfig.json paths configuration
2. **Type Errors**: Verify import statements and type definitions
3. **Build Errors**: Clear .next directory and rebuild
4. **Performance Issues**: Check for unnecessary re-renders and memory leaks

### Getting Help

1. Check existing documentation and code comments
2. Review similar implementations in the codebase
3. Consult the team or create an issue for complex problems
4. Use debugging tools to isolate the problem

---

This development guide should be updated as the project evolves and new patterns emerge.
