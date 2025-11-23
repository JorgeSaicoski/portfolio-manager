# Multi-Tenancy Architecture

How the loyalty points system supports multiple client organizations with shared infrastructure.

## Table of Contents

- [Overview](#overview)
- [Tenant Isolation Strategy](#tenant-isolation-strategy)
- [Database Schema](#database-schema)
- [Authentik Integration](#authentik-integration)
- [API Authentication Flow](#api-authentication-flow)
- [Security Considerations](#security-considerations)

---

## Overview

The loyalty points system supports **multi-tenancy** - multiple client organizations sharing the same infrastructure while maintaining strict data isolation.

**Key Principles:**

1. **Organization-level isolation** - Each client is an "organization"
2. **Group-based access control** - Authentik groups enforce permissions
3. **Database filtering** - All queries filter by `organization_id`
4. **API context** - Every request includes organization context

**Example:**

```
Shared Infrastructure:
├── NextDoorMarket (organization_id: 1)
│   ├── nextdoor-admins group
│   ├── nextdoor-cashiers group
│   └── nextdoor-customers group
│
├── CornerStore Co (organization_id: 2)
│   ├── cornerstore-admins group
│   ├── cornerstore-cashiers group
│   └── cornerstore-customers group
│
└── FreshMart (organization_id: 3)
    ├── freshmart-admins group
    ├── freshmart-cashiers group
    └── freshmart-customers group
```

---

## Tenant Isolation Strategy

### 1. Organization Model

Every resource belongs to an organization:

```go
type Organization struct {
    ID                   uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Name                 string    `gorm:"not null"`
    Slug                 string    `gorm:"uniqueIndex;not null"`
    AuthentikGroupPrefix string    `gorm:"not null"` // e.g., "nextdoor"
    Status               string    `gorm:"not null"` // active, suspended
    Plan                 string    `gorm:"not null"` // basic, premium
    CreatedAt            time.Time
    UpdatedAt            time.Time
    DeletedAt            *time.Time `gorm:"index"`
}
```

### 2. User Association

Users are linked to both Authentik and organization:

```go
type User struct {
    ID               uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    OrganizationID   uuid.UUID `gorm:"type:uuid;not null;index"`
    Organization     Organization
    AuthentikUserID  uuid.UUID `gorm:"type:uuid;not null;index"`
    Role             string    `gorm:"not null"` // admin, cashier, customer
    Status           string    `gorm:"not null"` // active, pending, suspended
    CreatedAt        time.Time
    UpdatedAt        time.Time
    DeletedAt        *time.Time `gorm:"index"`
}
```

### 3. All Resources Are Scoped

```go
type Purchase struct {
    ID             uuid.UUID `gorm:"type:uuid;primary_key"`
    OrganizationID uuid.UUID `gorm:"type:uuid;not null;index"` // ← Always present
    CashierID      uuid.UUID
    CustomerID     uuid.UUID
    Amount         float64
    PointsAwarded  int
    CreatedAt      time.Time
}

type PointsTransaction struct {
    ID             uuid.UUID `gorm:"type:uuid;primary_key"`
    OrganizationID uuid.UUID `gorm:"type:uuid;not null;index"` // ← Always present
    UserID         uuid.UUID
    Points         int
    TransactionType string // earned, redeemed, expired
    CreatedAt      time.Time
}
```

---

## Database Schema

### Core Tables

```sql
-- Organizations (your clients)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    authentik_group_prefix VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    settings JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Users (linked to Authentik + Organization)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    authentik_user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL, -- admin, cashier, customer
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    email VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    UNIQUE(organization_id, authentik_user_id)
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_authentik ON users(authentik_user_id);
CREATE INDEX idx_users_role ON users(organization_id, role);

-- Purchases
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    points_awarded INT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_org ON purchases(organization_id);
CREATE INDEX idx_purchases_customer ON purchases(organization_id, customer_id);
CREATE INDEX idx_purchases_date ON purchases(organization_id, created_at);

-- Points Transactions
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    points INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, expired, adjusted
    reference_id UUID, -- purchase_id or redemption_id
    reference_type VARCHAR(50), -- purchase, redemption, adjustment
    balance_after INT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_org ON points_transactions(organization_id);
CREATE INDEX idx_points_user ON points_transactions(organization_id, user_id);
CREATE INDEX idx_points_date ON points_transactions(organization_id, created_at);
```

### Key Constraints

1. **Every table has `organization_id`** - No global data
2. **Foreign keys include CASCADE** - Deleting org deletes all data
3. **Composite indexes** - Always include organization_id
4. **Unique constraints per org** - `UNIQUE(organization_id, field)`

---

## Authentik Integration

### Group Naming Convention

**Pattern:** `{organization_slug}-{role}`

**Examples:**
- `nextdoor-admins` - NextDoor administrators
- `nextdoor-cashiers` - NextDoor cashier staff
- `nextdoor-customers` - NextDoor end customers
- `carrefour-admins` - Carrefour administrators
- `carrefour-cashiers` - Carrefour cashier staff

### User Can Belong to Multiple Organizations

```
User: maria@example.com (Authentik UUID: abc-123)

Groups:
- nextdoor-customers (customer at NextDoor)
- carrefour-cashiers (employee at Carrefour)

In loyalty_db:
- users table row 1: organization_id=nextdoor, authentik_user_id=abc-123, role=customer
- users table row 2: organization_id=carrefour, authentik_user_id=abc-123, role=cashier
```

### Extracting Organization from Token

When user logs in, JWT contains groups:

```json
{
  "sub": "abc-123-def-456",
  "email": "maria@example.com",
  "groups": [
    "nextdoor-customers",
    "carrefour-cashiers"
  ]
}
```

Backend extracts organization:

```go
func ExtractOrganizations(groups []string) map[string]string {
    orgs := make(map[string]string)
    
    for _, group := range groups {
        parts := strings.Split(group, "-")
        if len(parts) >= 2 {
            orgSlug := parts[0]
            role := strings.Join(parts[1:], "-")
            orgs[orgSlug] = role
        }
    }
    
    return orgs
}

// Example result:
// {
//   "nextdoor": "customers",
//   "carrefour": "cashiers"
// }
```

---

## API Authentication Flow

### 1. User Makes Request

```http
GET /api/purchases
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
X-Organization: nextdoor
```

### 2. Middleware Validates Token

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract token
        token := extractToken(c)
        
        // Validate with Authentik
        claims, err := validateToken(token)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // Extract organizations from groups
        orgs := ExtractOrganizations(claims.Groups)
        
        // Get requested organization
        requestedOrg := c.GetHeader("X-Organization")
        
        // Verify user has access to this organization
        role, hasAccess := orgs[requestedOrg]
        if !hasAccess {
            c.JSON(403, gin.H{"error": "Access denied to organization"})
            c.Abort()
            return
        }
        
        // Store in context
        c.Set("authentik_user_id", claims.Sub)
        c.Set("organization_slug", requestedOrg)
        c.Set("user_role", role)
        c.Set("user_orgs", orgs)
        
        c.Next()
    }
}
```

### 3. Repository Filters by Organization

```go
func (r *purchaseRepository) List(ctx context.Context) ([]Purchase, error) {
    orgSlug := ctx.Value("organization_slug").(string)
    
    // Get organization ID
    var org Organization
    if err := r.db.Where("slug = ?", orgSlug).First(&org).Error; err != nil {
        return nil, err
    }
    
    // Query with organization filter
    var purchases []Purchase
    err := r.db.Where("organization_id = ?", org.ID).
        Order("created_at DESC").
        Find(&purchases).Error
    
    return purchases, err
}
```

### 4. Response Returns Scoped Data

User only sees data from their organization.

---

## Security Considerations

### 1. Always Filter by Organization

**❌ NEVER do this:**
```go
// BAD: No organization filter!
db.Where("user_id = ?", userID).Find(&purchases)
```

**✅ ALWAYS do this:**
```go
// GOOD: Organization filter included
db.Where("organization_id = ? AND user_id = ?", orgID, userID).Find(&purchases)
```

### 2. Use Prepared Statements

GORM handles this, but be careful with raw queries:

```go
// GOOD
db.Raw("SELECT * FROM purchases WHERE organization_id = ?", orgID).Scan(&purchases)

// BAD - SQL injection risk
db.Raw(fmt.Sprintf("SELECT * FROM purchases WHERE organization_id = '%s'", orgID)).Scan(&purchases)
```

### 3. Validate Organization Access

```go
func RequireOrganizationAccess(allowedRoles []string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("user_role")
        
        hasAccess := false
        for _, role := range allowedRoles {
            if userRole == role {
                hasAccess = true
                break
            }
        }
        
        if !hasAccess {
            c.JSON(403, gin.H{"error": "Insufficient permissions"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// Usage
router.GET("/admin/users", 
    AuthMiddleware(),
    RequireOrganizationAccess([]string{"admins"}),
    handlers.ListUsers,
)
```

### 4. Audit Logging

Log all access with organization context:

```go
log.Printf("[AUDIT] org=%s user=%s role=%s action=%s resource=%s",
    orgSlug, userID, role, "read", "purchases")
```

---

## Testing Multi-Tenancy

### Test Cases

1. **User can't access other org's data**
2. **User with multiple orgs sees correct data per context**
3. **Database queries always include organization filter**
4. **API returns 403 for unauthorized org access**
5. **Organization deletion removes all related data (CASCADE)**

### Example Test

```go
func TestOrganizationIsolation(t *testing.T) {
    // Create two organizations
    nextdoor := createOrg("NextDoor Market", "nextdoor")
    carrefour := createOrg("Carrefour Brasil", "carrefour")
    
    // Create users in each org
    nextdoorCustomer := createUser(nextdoor.ID, "customer")
    carrefourCustomer := createUser(carrefour.ID, "customer")
    
    // Create purchases
    nextdoorPurchase := createPurchase(nextdoor.ID, nextdoorCustomer.ID)
    carrefourPurchase := createPurchase(carrefour.ID, carrefourCustomer.ID)
    
    // Test: NextDoor customer should only see NextDoor purchases
    purchases, err := repo.ListPurchases(context.WithValue(ctx, "organization_id", nextdoor.ID))
    assert.NoError(t, err)
    assert.Len(t, purchases, 1)
    assert.Equal(t, nextdoorPurchase.ID, purchases[0].ID)
    
    // Test: Carrefour customer should only see Carrefour purchases
    purchases, err = repo.ListPurchases(context.WithValue(ctx, "organization_id", carrefour.ID))
    assert.NoError(t, err)
    assert.Len(t, purchases, 1)
    assert.Equal(t, carrefourPurchase.ID, purchases[0].ID)
}
```

---

## Related Documentation

- **[Client Onboarding](../deployment/client-onboarding.md)** - Deploy for new client
- **[User Management](../authentication/user-management/)** - Create and manage users
- **[Database Schema](./database-schema.md)** - Complete schema reference

