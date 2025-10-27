# Contributing to Portfolio Manager

Thank you for your interest in contributing to Portfolio Manager! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Review Process](#review-process)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting comments, or personal attacks
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

---

## Getting Started

###1. Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/portfolio-manager.git
cd portfolio-manager
```

### 2. Set Up Development Environment

Follow our [Development Setup Guide](docs/development/getting-started.md)

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && go mod download

# Create .env
cp .env.example .env

# Start services
podman compose up -d
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/your-bug-fix
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

---

## Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow our coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 2. Test Your Changes

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test

# Integration tests
./scripts/test-integration.sh
```

### 3. Commit Your Changes

**Commit message format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
# Good commit messages
git commit -m "feat(auth): add PKCE support to OAuth flow"
git commit -m "fix(api): handle null values in portfolio response"
git commit -m "docs(setup): add troubleshooting section"

# With body
git commit -m "feat(portfolio): add export to PDF functionality

Implements PDF export using wkhtmltopdf library.
Adds new API endpoint /api/portfolios/{id}/export/pdf.
Includes frontend download button.

Closes #123"
```

### 4. Keep Your Branch Updated

```bash
# Fetch upstream changes
git remote add upstream https://github.com/JorgeSaicoski/portfolio-manager.git
git fetch upstream

# Rebase on main
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

---

## Coding Standards

### Go (Backend)

**Style:**
- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Use `gofmt` for formatting
- Run `golint` and `go vet`

**Code structure:**
```go
// Good
func GetPortfolio(c *gin.Context) {
    id := c.Param("id")
    portfolio, err := service.GetPortfolio(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
        return
    }
    c.JSON(http.StatusOK, portfolio)
}

// Bad - no error handling
func GetPortfolio(c *gin.Context) {
    portfolio, _ := service.GetPortfolio(c.Param("id"))
    c.JSON(http.StatusOK, portfolio)
}
```

**Testing:**
```go
// Always write table-driven tests
func TestGetPortfolio(t *testing.T) {
    tests := []struct {
        name       string
        portfolioID string
        want       *Portfolio
        wantErr    bool
    }{
        {"valid ID", "123", &Portfolio{ID: "123"}, false},
        {"invalid ID", "999", nil, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := GetPortfolio(tt.portfolioID)
            if (err != nil) != tt.wantErr {
                t.Errorf("GetPortfolio() error = %v, wantErr %v", err, tt.wantErr)
            }
            // ...
        })
    }
}
```

### TypeScript/Svelte (Frontend)

**Style:**
- Use TypeScript for type safety
- Follow [Svelte best practices](https://svelte.dev/docs)
- Use Prettier for formatting

**Component structure:**
```svelte
<script lang="ts">
  // Imports
  import type { Portfolio } from '$lib/types';

  // Props
  export let portfolio: Portfolio;

  // Local state
  let isEditing = false;

  // Functions
  function handleEdit() {
    isEditing = true;
  }
</script>

<div class="portfolio-card">
  <h2>{portfolio.title}</h2>
  <button on:click={handleEdit}>Edit</button>
</div>

<style>
  .portfolio-card {
    padding: 1rem;
    border: 1px solid #ddd;
  }
</style>
```

**Type definitions:**
```typescript
// Good - explicit types
interface Portfolio {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

// Bad - using any
interface Portfolio {
  id: any;
  title: any;
}
```

### General Best Practices

- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple, Stupid)
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./internal/application/services

# Verbose output
go test -v ./...
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- Login.test.ts
```

### Integration Tests

```bash
# Start test environment
podman compose -f docker-compose.test.yml up -d

# Run integration tests
./scripts/test-integration.sh

# Cleanup
podman compose -f docker-compose.test.yml down
```

### Writing Good Tests

- Test behavior, not implementation
- Use descriptive test names
- Test edge cases and error conditions
- Keep tests independent
- Mock external dependencies

---

## Submitting Changes

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Create a Pull Request

1. Go to GitHub and create a new Pull Request
2. Fill out the PR template:

**Title:** Brief description of changes

**Description:**
```markdown
## What does this PR do?
Brief description of the changes.

## Why are these changes needed?
Explain the problem you're solving.

## How has this been tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Related Issues
Closes #123

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Reviewed my own code
```

### 3. Wait for Review

- Respond to feedback promptly
- Make requested changes
- Keep the PR updated with main branch

---

## Review Process

### What We Look For

1. **Code Quality**
   - Follows coding standards
   - Well-structured and readable
   - Proper error handling

2. **Testing**
   - Adequate test coverage
   - Tests pass
   - Edge cases covered

3. **Documentation**
   - Code comments where needed
   - README/docs updated
   - API changes documented

4. **Security**
   - No security vulnerabilities
   - Sensitive data handled properly
   - Input validation

5. **Performance**
   - No obvious performance issues
   - Efficient algorithms
   - Proper resource management

### Review Timeline

- Initial review: 1-3 days
- Follow-up reviews: 1-2 days
- We aim to merge approved PRs within 1 week

### Getting Your PR Merged

- ✅ All checks pass (tests, linting)
- ✅ At least 1 approval from maintainer
- ✅ No unresolved conversations
- ✅ Branch up to date with main
- ✅ Changelog updated (for significant changes)

---

## Types of Contributions

### Bug Reports

- Use GitHub Issues
- Include reproduction steps
- Provide error logs
- Specify environment details

### Feature Requests

- Use GitHub Discussions
- Explain the use case
- Describe expected behavior
- Consider implementation approach

### Documentation

- Fix typos and errors
- Improve clarity
- Add examples
- Update outdated information

### Code Contributions

- Features
- Bug fixes
- Performance improvements
- Refactoring

---

## Community

### Getting Help

- **Documentation**: [docs/](docs/)
- **GitHub Discussions**: Ask questions, share ideas
- **GitHub Issues**: Report bugs, request features

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Special thanks in changelogs

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Portfolio Manager! 🎉**

Your contributions make this project better for everyone.
