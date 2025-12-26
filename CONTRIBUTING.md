# Contributing to S3-Karo

Thank you for your interest in contributing to S3-Karo! This document provides guidelines and instructions for contributing.

## Project Structure

```
s3-karo/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (private)/        # Private routes
│   └── api/               # API routes
├── components/            # React components
│   ├── common/           # Shared components
│   ├── form-inputs/      # Form components
│   ├── layout/           # Layout components
│   ├── ui/               # UI primitives (shadcn)
│   └── wrappers/         # Wrapper components
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   ├── managed-storage/  # Platform-managed storage
│   ├── private-s3/       # Private S3 integration
│   └── shared/           # Shared utilities
├── lib/                   # Core libraries
│   ├── auth/             # Authentication utilities
│   ├── database/         # Database layer
│   ├── email/            # Email utilities
│   └── utils/            # General utilities
├── docs/                  # Public documentation
└── local-docs/           # Internal documentation
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/s3-karo.git
   cd s3-karo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required variables
   - Validate: `pnpm validate-env`

4. **Set up database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add CDN URL support`
- `fix: resolve database null check errors`
- `docs: update API documentation`

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add comments for complex logic
   - Update documentation if needed

3. **Run checks**
   ```bash
   pnpm lint          # Check code style
   pnpm type-check    # Verify TypeScript
   pnpm validate-env  # Validate environment
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow conventional commit format

5. **Submit a pull request**
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

## Questions?

Open an issue or reach out to the maintainers.
