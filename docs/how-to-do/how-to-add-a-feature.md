# How to Add a Feature to Portfolio Manager

This guide walks you through the complete workflow of adding a new feature - from creating a branch to deploying to production.

**Time required**: 1-2 hours (depending on feature complexity)
**Difficulty**: Beginner-friendly
**What you'll learn**: Git workflow, testing, code review, deployment process

---

## 📋 What & Why

**What you'll accomplish:**
- Create a feature branch
- Write and test code locally
- Run automated tests and checks
- Create a pull request
- Review and merge code
- Deploy to staging
- Test in staging environment
- Deploy to production

**Why it matters:**
- Proper workflow prevents bugs in production
- Testing catches issues before users see them
- Code review improves quality
- Staging environment lets you verify changes safely

---

## ✅ Prerequisites

- [ ] Project cloned locally (`git clone ...`)
- [ ] Development environment set up (`make setup`)
- [ ] Services running locally (`make start`)
- [ ] Git configured with your name/email
- [ ] Access to repository (push permissions)

**Verify setup:**
```bash
cd /path/to/portfolio-manager

# Check Git is configured
git config user.name
git config user.email

# Check services are running
make status
# All should show "Up" or "healthy"

# Check you're on main or develop branch
git branch
# Should see: * main or * develop
```

---

## 📝 Step-by-Step Instructions

### Part 1: Plan Your Feature (10 minutes)

#### Step 1.1: Define What You're Building

**Example**: Let's say we want to add a "Featured" flag to projects so users can mark their best work.

Write down:
1. **What**: Add a `featured` boolean field to projects
2. **Where**: Backend model, database, frontend UI
3. **Why**: Help users highlight their best projects
4. **How**: Checkbox in project form, badge on project cards

#### Step 1.2: Check Existing Code

```bash
# Search for similar features
cd backend
grep -r "is_main" .  # Similar boolean field for images

cd ../frontend
grep -r "checkbox" src/lib/components/
# Look at how other checkboxes are implemented
```

---

### Part 2: Create Feature Branch (5 minutes)

#### Step 2.1: Update Your Local Repository

```bash
# Make sure you're on develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Verify you're up to date
git status
# Should say "Your branch is up to date"
```

#### Step 2.2: Create Feature Branch

```bash
# Create and switch to new branch
# Format: feature/brief-description
git checkout -b feature/add-featured-flag-to-projects

# Verify you're on the new branch
git branch
# Should show: * feature/add-featured-flag-to-projects
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

---

### Part 3: Make Backend Changes (30 minutes)

#### Step 3.1: Update Database Model

```bash
# Edit the Project model
nano backend/internal/application/models/project.go
```

**Add the field:**
```go
type Project struct {
    gorm.Model
    Title       string  `gorm:"type:varchar(100);not null" json:"title"`
    Description *string `gorm:"type:text" json:"description"`
    // ... other fields ...
    Featured    bool    `gorm:"default:false" json:"featured"`  // ADD THIS LINE
    Position    int     `gorm:"default:0" json:"position"`
    // ... rest of fields ...
}
```

**Save** (Ctrl+X, Y, Enter)

#### Step 3.2: Update DTO (Data Transfer Object)

```bash
# Edit project DTOs
nano backend/internal/shared/dto/project.go
```

**Add to CreateProjectRequest and UpdateProjectRequest:**
```go
type CreateProjectRequest struct {
    Title       string   `json:"title" binding:"required"`
    Description *string  `json:"description"`
    // ... other fields ...
    Featured    bool     `json:"featured"`  // ADD THIS LINE
    // ... rest of fields ...
}

type UpdateProjectRequest struct {
    Title       string   `json:"title" binding:"required"`
    Description *string  `json:"description"`
    // ... other fields ...
    Featured    bool     `json:"featured"`  // ADD THIS LINE
    // ... rest of fields ...
}
```

**Save**

#### Step 3.3: Test Database Migration

```bash
# Run the app - it will auto-migrate
cd backend
go run cmd/main/main.go

# You should see in logs:
# "Migrating database..."
# "Migration completed successfully"

# Press Ctrl+C to stop

# Check migration worked
# The database now has the 'featured' column
```

#### Step 3.4: Write a Test

```bash
# Edit project tests
nano backend/cmd/test/project_test.go
```

**Add a new test:**
```go
func TestProject_CreateWithFeatured(t *testing.T) {
    token := GetTestAuthToken()

    // Create category first
    categoryResp := CreateTestCategory(t, token, "Test Category")
    categoryID := categoryResp["ID"].(float64)

    // Create project with featured=true
    payload := map[string]interface{}{
        "title":       "Featured Project",
        "description": "This is my best work",
        "category_id": categoryID,
        "featured":    true,  // Test the new field
    }

    resp := MakeRequest(t, "POST", "/api/projects/own", payload, token)

    AssertJSONResponse(t, resp, 201, func(body map[string]interface{}) {
        assert.Contains(t, body, "data")
        data := body["data"].(map[string]interface{})
        assert.Equal(t, true, data["featured"])
    })
}
```

**Save**

---

### Part 4: Make Frontend Changes (30 minutes)

#### Step 4.1: Update TypeScript Types

```bash
# Edit API types
nano frontend/src/lib/types/api.ts
```

**Add to Project interface:**
```typescript
export interface Project {
  ID: number;
  title: string;
  description: string;
  // ... other fields ...
  featured: boolean;  // ADD THIS LINE
  position: number;
  // ... rest of fields ...
}
```

**Save**

#### Step 4.2: Update Project Form Component

```bash
# Edit project form
nano frontend/src/lib/components/admin/ProjectForm.svelte
```

**Add in the `<script>` section:**
```svelte
let featured = project?.featured || false;
```

**Add in the form (after description field):**
```svelte
<div class="form-group">
  <label>
    <input type="checkbox" bind:checked={featured} />
    Mark as Featured Project
  </label>
  <p class="help-text">Featured projects are highlighted to visitors</p>
</div>
```

**Update the submit function to include featured:**
```svelte
const projectData = {
  title,
  description,
  // ... other fields ...
  featured,  // ADD THIS LINE
  // ... rest of fields ...
};
```

**Save**

#### Step 4.3: Add Visual Indicator on Project Cards

```bash
# Edit project table or card component
nano frontend/src/lib/components/admin/ProjectTable.svelte
```

**Add featured badge in the table:**
```svelte
{#each projects as project}
  <tr>
    <td>
      {project.title}
      {#if project.featured}
        <span class="badge badge-featured">⭐ Featured</span>
      {/if}
    </td>
    <!-- ... rest of columns ... -->
  </tr>
{/each}
```

**Add CSS for the badge:**
```svelte
<style>
  .badge-featured {
    background: #ffd700;
    color: #000;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-left: 8px;
  }
</style>
```

**Save**

---

### Part 5: Test Locally (20 minutes)

#### Step 5.1: Run Backend Tests

```bash
cd backend

# Run all tests
go test -v ./...

# Should see:
# PASS: TestProject_CreateWithFeatured
# ... other tests ...
# PASS

# If any fail, fix them before continuing!
```

#### Step 5.2: Run Frontend Type Check

```bash
cd frontend

# Install dependencies (if not already)
npm install

# Run type checking
npm run check

# Should see: "No errors found"
# If errors, fix them!
```

#### Step 5.3: Test in Browser

```bash
# Make sure services are running
cd ..  # back to root
make status

# If not running:
make start

# Wait for services to start (30 seconds)
```

**Manual testing:**
1. Open browser: `http://localhost:3000`
2. Log in to admin panel
3. Go to Projects
4. Click "New Project"
5. Fill in details
6. ✅ Check the "Mark as Featured" checkbox
7. Click "Create"
8. Verify the project shows ⭐ Featured badge
9. Edit the project
10. Uncheck "Featured"
11. Save
12. Verify badge is gone

**If everything works, proceed! If not, debug and fix.**

#### Step 5.4: Run All CI Checks

```bash
# Run the same checks that CI will run
make ci-all

# This runs:
# - Backend tests
# - Backend linting
# - Security scans
# - Frontend type checking
# - Coverage reports

# All should PASS ✅
```

---

### Part 6: Commit Your Changes (10 minutes)

#### Step 6.1: Check What Changed

```bash
git status

# You should see modified files:
# backend/internal/application/models/project.go
# backend/internal/shared/dto/project.go
# backend/cmd/test/project_test.go
# frontend/src/lib/types/api.ts
# frontend/src/lib/components/admin/ProjectForm.svelte
# frontend/src/lib/components/admin/ProjectTable.svelte
```

#### Step 6.2: Stage Changes

```bash
# Add all changed files
git add .

# Or add specific files
git add backend/internal/application/models/project.go
git add backend/internal/shared/dto/project.go
# ... etc
```

#### Step 6.3: Commit with Good Message

```bash
git commit -m "feat: add featured flag to projects

- Add 'featured' boolean field to Project model
- Update DTOs for create/update requests
- Add checkbox in project form
- Display featured badge on project cards
- Add test for featured project creation

This allows users to highlight their best projects."

# Commit message format:
# Line 1: type: brief description
# Line 2: blank
# Line 3+: detailed explanation

# Types: feat, fix, refactor, docs, test, chore
```

#### Step 6.4: Push to Remote

```bash
# Push your branch
git push origin feature/add-featured-flag-to-projects

# If this is the first push, Git will suggest:
git push --set-upstream origin feature/add-featured-flag-to-projects
```

---

### Part 7: Create Pull Request (10 minutes)

#### Step 7.1: Open Pull Request in Gitea/GitHub

1. Go to your repository in browser
2. You'll see: **"feature/add-featured-flag-to-projects recently pushed"**
3. Click **"Compare & pull request"**

#### Step 7.2: Fill in PR Details

**Title:**
```
feat: Add featured flag to projects
```

**Description:**
```markdown
## Summary
Adds a "featured" boolean field to projects so users can highlight their best work.

## Changes
- ✅ Added `featured` field to Project model
- ✅ Updated backend DTOs
- ✅ Added checkbox in project form
- ✅ Display featured badge (⭐) on project cards
- ✅ Added test coverage

## Testing
- [x] Backend tests pass
- [x] Frontend type checking passes
- [x] Manually tested create/edit/display
- [x] CI checks pass locally

## Screenshots
[Add screenshot of featured checkbox and badge if possible]

## Checklist
- [x] Code follows project style
- [x] Tests added
- [x] Documentation updated (if needed)
- [x] No breaking changes
```

**Base branch**: `develop` (not main!)

4. Click **"Create Pull Request"**

#### Step 7.3: Wait for CI to Run

Gitea Actions will automatically:
- ✅ Run all tests
- ✅ Run linting
- ✅ Run security scans
- ✅ Check code quality

**You'll see**: Green checkmarks ✅ if all pass

If anything fails ❌, fix it:
1. Make changes locally
2. Commit and push
3. CI runs again automatically

---

### Part 8: Code Review (Variable time)

#### Step 8.1: Request Review

1. In PR, click **"Reviewers"**
2. Select team members
3. They'll get notified

#### Step 8.2: Address Feedback

Reviewers might comment:
- Questions about code
- Suggestions for improvement
- Requests for changes

**Respond to feedback:**
1. Make requested changes locally
2. Commit and push (adds to same PR)
3. Reply to comments

**Example exchange:**
```
Reviewer: "Should featured projects appear first in the list?"
You: "Good idea! I'll add sorting by featured flag."
[Make changes, commit, push]
You: "Done! Featured projects now appear first. See commit abc123"
```

#### Step 8.3: Get Approval

When reviewer approves:
- ✅ Green "Approved" checkmark appears
- ✅ "Merge" button becomes available

---

### Part 9: Merge and Deploy to Staging (10 minutes)

#### Step 9.1: Merge Pull Request

1. Click **"Merge Pull Request"**
2. Choose **"Squash and Merge"** (combines all commits into one)
3. Edit merge commit message if needed
4. Click **"Confirm Merge"**
5. Delete feature branch (checkbox or click "Delete branch")

#### Step 9.2: Pull Latest Develop

```bash
# Switch back to develop
git checkout develop

# Pull the merged changes
git pull origin develop

# Verify your commit is there
git log --oneline -5
# Should see your merged commit at the top
```

#### Step 9.3: Automatic Staging Deployment

**If CI/CD is set up** (see [CI/CD guide](../deployment/cicd-setup.md)):

- Merging to `develop` automatically deploys to staging
- Check Gitea Actions to see deployment progress
- Wait 5-10 minutes

**If no CI/CD** (manual deployment):

```bash
# On staging server
ssh deploy@staging-server-ip
cd /opt/portfolio-manager-staging
git pull origin develop
docker compose up -d --build
exit
```

---

### Part 10: Test in Staging (15 minutes)

#### Step 10.1: Access Staging Environment

```bash
# Open staging URL
https://staging.yourdomain.com

# Or by IP:
http://staging-server-ip:3000
```

#### Step 10.2: Test the Feature

**Complete test checklist:**

- [ ] Can create project with featured=true
- [ ] Featured badge appears
- [ ] Can edit and uncheck featured
- [ ] Badge disappears
- [ ] Featured projects sort first (if you added that)
- [ ] No console errors
- [ ] Works on mobile (resize browser)
- [ ] Database persists featured flag (refresh page)

#### Step 10.3: Ask Others to Test

Share staging URL with team:
```
Hey team! 👋

New feature ready for testing:
- Added "Featured" flag to projects
- Test at: https://staging.yourdomain.com
- Try creating/editing projects

Let me know if you find any issues!
```

---

### Part 11: Deploy to Production (10 minutes)

#### Step 11.1: Merge to Main

After testing in staging:

1. Create PR from `develop` to `main`
2. Title: `Release: Featured projects feature`
3. Get approval (if required)
4. Merge to main

#### Step 11.2: Create Version Tag

```bash
# Pull latest main
git checkout main
git pull origin main

# Create version tag
git tag -a v1.1.0 -m "Release v1.1.0: Featured projects feature

- Add featured flag to projects
- Display featured badge
- Featured projects sort first"

# Push tag
git push origin v1.1.0
```

**Versioning:**
- `v1.0.0` → `v1.1.0` (minor - new feature)
- `v1.1.0` → `v1.1.1` (patch - bug fix)
- `v1.0.0` → `v2.0.0` (major - breaking changes)

#### Step 11.3: Deployment

**If CI/CD is set up**:
- Pushing tag automatically deploys to production
- Monitor in Gitea Actions
- Get notified when complete

**Manual deployment**:
```bash
ssh deploy@production-server-ip
cd /opt/portfolio-manager
git fetch --tags
git checkout v1.1.0
docker compose up -d --build
exit
```

---

### Part 12: Verify Production (10 minutes)

#### Step 12.1: Smoke Test

```bash
# Check health
curl https://yourdomain.com/api/health

# Should return: {"status":"healthy"}
```

#### Step 12.2: Test Feature Live

1. Go to `https://yourdomain.com`
2. Log in
3. Create a featured project
4. Verify it works

#### Step 12.3: Monitor for Issues

```bash
# Check logs for errors
ssh deploy@production-server-ip
docker compose logs -f backend | grep ERROR
docker compose logs -f frontend | grep ERROR

# Check Grafana for metrics
https://yourdomain.com:3001
# Look for error spikes
```

**Monitor for 24-48 hours** after release.

---

## ✔️ Verification Checklist

Before considering the feature complete:

- [ ] Code merged to develop
- [ ] Code merged to main
- [ ] Version tag created and pushed
- [ ] Deployed to staging successfully
- [ ] Tested in staging environment
- [ ] Deployed to production successfully
- [ ] Tested in production
- [ ] No errors in logs
- [ ] Metrics look normal
- [ ] Users can use the feature
- [ ] Documentation updated (if needed)
- [ ] Feature announced to users (if public-facing)

✅ **All checked? Feature is DONE!** 🎉

---

## 🔧 Troubleshooting

### Problem: Tests Fail Locally

**Error**: `go test` fails

**Solutions**:
```bash
# Run specific failing test
go test -v -run TestNameHere

# Check test logs
go test -v ./... 2>&1 | grep FAIL

# Common issues:
# 1. Database not running
docker compose ps | grep postgres

# 2. Test fixtures missing
# Check backend/cmd/test/fixtures.go

# 3. Syntax error
go build ./...
```

### Problem: Frontend Type Errors

**Error**: `npm run check` shows errors

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check specific file
npx svelte-check --tsconfig tsconfig.json src/lib/components/admin/ProjectForm.svelte

# Common issues:
# 1. Missing type definition - add to api.ts
# 2. Wrong import path - check import statement
# 3. Type mismatch - check interface matches backend
```

### Problem: CI Fails But Local Passes

**Error**: CI shows ❌ but local tests pass ✅

**Solutions**:
```bash
# Run exact CI commands locally
make ci-all

# Common issues:
# 1. Uncommitted files
git status  # Check for unstaged changes

# 2. Different Go version
go version  # Should match CI (1.24)

# 3. Cached build
go clean -cache
```

### Problem: Merge Conflicts

**Error**: Can't merge because of conflicts

**Solutions**:
```bash
# Update your branch with latest develop
git checkout feature/your-branch
git fetch origin
git merge origin/develop

# Fix conflicts in editor
# Look for:
# <<<<<<< HEAD
# your code
# =======
# their code
# >>>>>>> origin/develop

# After fixing:
git add .
git commit -m "fix: resolve merge conflicts"
git push
```

### Problem: Deployment Failed

**Error**: Deployment to staging/production fails

**Solutions**:
```bash
# Check deployment logs in Gitea Actions
# Or manually:

ssh deploy@server-ip
cd /opt/portfolio-manager
docker compose logs backend

# Common issues:
# 1. Port already in use
docker compose down
docker compose up -d

# 2. Database migration failed
docker compose logs portfolio-postgres

# 3. Environment variable missing
cat .env | grep FEATURE_FLAG

# Rollback if needed:
git checkout v1.0.0  # previous version
docker compose up -d --build
```

---

## ➡️ Next Steps

**Feature deployed successfully!** 🎉 Now what?

1. **Monitor Performance**:
   - Check Grafana dashboards
   - Watch for increased errors
   - Monitor response times

2. **Gather Feedback**:
   - Ask users what they think
   - Create feedback issue in repository
   - Plan improvements

3. **Document**:
   - Update user documentation
   - Add to changelog
   - Create release notes

4. **Plan Next Feature**:
   - Check issue backlog
   - Prioritize features
   - Start the cycle again!

---

## 📚 Related Guides

- [How to Test](./how-to-test.md) - Deep dive into testing
- [How to Rollback](./how-to-rollback.md) - If something goes wrong
- [How to Investigate](./how-to-investigate.md) - Debug issues
- [CI/CD Setup](../deployment/cicd-setup.md) - Automate this workflow

---

## 🎓 What You Learned

- ✅ Git branching workflow (feature → develop → main)
- ✅ Writing backend code (models, DTOs, tests)
- ✅ Writing frontend code (TypeScript, Svelte)
- ✅ Running automated tests and checks
- ✅ Creating good pull requests
- ✅ Code review process
- ✅ Deploying to staging and production
- ✅ Verifying deployments
- ✅ Monitoring after release

**You can now confidently add features to the project!** 🚀

---

**Last Updated**: 2025-01-25
**Difficulty**: Beginner
**Estimated Time**: 1-2 hours
