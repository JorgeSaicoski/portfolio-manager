# Style System Documentation

## 📐 **Style Architecture**

### ⚠️ **Critical Guidelines**

**ALL styles must be centralized in `/src/lib/styles/` folder.**

#### ✅ Correct Approach
```
src/lib/styles/
├── global.scss                    # Main entry point
└── components/
    ├── _buttons.scss              # Button styles
    ├── _cards.scss                # Card layouts
    ├── _forms.scss                # Form inputs
    ├── _content-blocks.scss       # Content blocks
    └── ... (other components)
```

#### ❌ Wrong Approach
```svelte
<!-- DON'T: Inline styles in components -->
<style>
  .my-custom-button {
    background: blue;
  }
</style>
```

#### 🎯 Why Centralized Styles?

1. **Single Source of Truth** - All design decisions in one location
2. **Easier for UX/UI Specialists** - No hunting through component files
3. **Consistency** - Prevents duplicate or conflicting styles
4. **Maintainability** - Update once, applies everywhere
5. **Better Collaboration** - Designers own the styles folder
6. **Performance** - Single compiled CSS file, better caching

#### 📝 When to Use Component-Level Styles

**Only use component `<style>` blocks for:**
- Global CSS fixes (like `:global(.icon-stroke)`)
- Component-specific layout that CANNOT be reused
- Temporary overrides (document with TODO comment)

**In 99% of cases, add styles to the appropriate file in `/src/lib/styles/components/`**

---

## 🎨 **Design Tokens**

### Color System
```scss
// Brand Colors (from your logo)
--color-primary: #2DD4BF;        // Teal
--color-primary-dark: #14B8A6;   // Darker teal
--color-secondary: #1E3A3A;      // Navy

// Usage in HTML
<div class="text-primary">Teal text</div>
<div class="bg-secondary">Navy background</div>
```

### Typography Scale
```scss
// Font Families
--font-handwritten: 'Patrick Hand', cursive;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

// Fluid Font Sizes
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
--text-5xl: clamp(3rem, 2.5rem + 2.5vw, 4.5rem);
```

### Spacing System
```scss
--space-1: 0.25rem;  // 4px
--space-4: 1rem;     // 16px
--space-16: 4rem;    // 64px
```

---

## 🔘 **Buttons**

### Basic Usage
```html
<!-- Primary CTA -->
<button class="btn btn-primary">Access Free Manager</button>

<!-- Secondary Action -->
<button class="btn btn-secondary">Learn More</button>

<!-- Outline Style -->
<button class="btn btn-outline">Get Started</button>

<!-- Ghost/Subtle -->
<button class="btn btn-ghost">Cancel</button>
```

### Special Buttons
```html
<!-- Handwritten Style (Perfect for main CTAs) -->
<button class="btn btn-handwritten">🐦 Protect Your Digital Offspring</button>

<!-- With Protective Glow -->
<button class="btn btn-primary protective">Get Protected</button>

<!-- Loading State -->
<button class="btn btn-primary btn-loading">Processing...</button>
```

### Sizes & Variants
```html
<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-xl">Extra Large</button>

<!-- Icon Button -->
<button class="btn btn-icon btn-primary">
  <svg>...</svg>
</button>

<!-- Full Width -->
<button class="btn btn-primary btn-block">Full Width</button>

<!-- Floating Action Button -->
<button class="btn btn-fab btn-primary">
  <svg>...</svg>
</button>
```

---

## 📝 **Forms**

### Basic Form Structure
```html
<form class="form">
  <div class="form-group">
    <label class="form-label" for="email">
      Email Address <span class="required">*</span>
    </label>
    <input type="email" id="email" class="form-input" placeholder="your@email.com">
    <div class="form-help">We'll never share your email</div>
  </div>
  
  <div class="form-group">
    <button type="submit" class="btn btn-primary btn-block">Submit</button>
  </div>
</form>
```

### Form Cards (Login/Register)
```html
<div class="form-card">
  <div class="form-header">
    <div class="logo">🐦</div>
    <h2>Welcome Back</h2>
    <p>Sign in to your protected space</p>
  </div>
  
  <form class="login-form">
    <div class="form-group">
      <label class="form-label" for="email">Email</label>
      <div class="form-input-icon">
        <svg class="icon">...</svg>
        <input type="email" id="email" class="form-input" placeholder="Enter your email">
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Sign In Securely</button>
      <div class="forgot-password">
        <a href="#">Forgot your password?</a>
      </div>
    </div>
  </form>
  
  <div class="form-footer">
    <p>Don't have an account? <a href="#">Sign up here</a></p>
  </div>
</div>
```

### Form States
```html
<!-- Error State -->
<div class="form-group">
  <input type="email" class="form-input error" placeholder="Email">
  <div class="form-error">
    <svg class="icon">!</svg>
    Please enter a valid email address
  </div>
</div>

<!-- Success State -->
<div class="form-group">
  <input type="email" class="form-input success" placeholder="Email">
  <div class="form-success">
    <svg class="icon">✓</svg>
    Email looks great!
  </div>
</div>
```

### Product Form (E-commerce)
```html
<form class="product-form">
  <div class="form-section">
    <h3><svg class="icon">📦</svg> Product Details</h3>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input type="text" class="form-input" placeholder="Enter product name">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select">
          <option>Select category</option>
        </select>
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">Price</label>
      <div class="price-input">
        <input type="number" class="form-input" placeholder="0.00">
      </div>
    </div>
  </div>
  
  <div class="form-section">
    <h3><svg class="icon">🖼️</svg> Product Images</h3>
    <div class="image-upload">
      <svg class="upload-icon">📤</svg>
      <p class="upload-text">
        <strong>Click to upload</strong> or drag and drop
      </p>
      <p class="upload-hint">PNG, JPG up to 10MB</p>
      <input type="file" accept="image/*" multiple>
    </div>
  </div>
</form>
```

---

## 🃏 **Cards**

### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
    <p>Subtitle or description</p>
  </div>
  <div class="card-body">
    <p>Main content goes here.</p>
  </div>
  <div class="card-footer">
    <div class="card-actions">
      <button class="btn btn-primary">Action</button>
      <button class="btn btn-ghost">Cancel</button>
    </div>
  </div>
</div>
```

### Feature Cards (Benefits Section)
```html
<div class="card card-feature">
  <div class="feature-icon">
    💰
  </div>
  <h3>Smart Economy</h3>
  <p>We analyze your real needs and develop solutions with the best cost-benefit.</p>
</div>
```

### Service Cards (For Sarkis.dev Services)
```html
<div class="card card-service popular">
  <div class="service-header">
    <div class="service-icon">
      <svg>🛡️</svg>
    </div>
    <div class="service-title-group">
      <h3>Personal Manager</h3>
      <p>Complete life control system</p>
    </div>
  </div>
  
  <ul class="service-features">
    <li><svg class="icon">✓</svg> Task management</li>
    <li><svg class="icon">✓</svg> Finance tracking</li>
    <li><svg class="icon">✓</svg> Calendar integration</li>
    <li><svg class="icon">✓</svg> 100% free forever</li>
  </ul>
  
  <div class="service-actions">
    <button class="btn btn-primary btn-block">Get Started Free</button>
  </div>
</div>
```

### Card Layouts
```html
<!-- Card Grid -->
<div class="card-grid cols-3">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>

<!-- With Staggered Animation -->
<div class="card-grid cols-2 animate-stagger">
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

---

## 🧭 **Navigation**

### Main Navbar
```html
<nav class="navbar">
  <div class="navbar-container">
    <!-- Brand/Logo -->
    <a href="/" class="navbar-brand">
      <div class="logo">
        <span class="bird-emoji">🐦</span>
      </div>
      <div class="brand-text">
        <h1 class="title">Sarkis.dev</h1>
        <p class="tagline">Protecting digital offspring</p>
      </div>
    </a>
    
    <!-- Navigation Links -->
    <ul class="navbar-nav">
      <li class="nav-item">
        <a href="/" class="nav-link active">Home</a>
      </li>
      <li class="nav-item">
        <a href="/services" class="nav-link">Services</a>
      </li>
      <li class="nav-item has-dropdown">
        <a href="/about" class="nav-link">About</a>
        <div class="dropdown">
          <a href="/team" class="dropdown-item">Our Team</a>
          <a href="/story" class="dropdown-item">Our Story</a>
        </div>
      </li>
    </ul>
    
    <!-- Action Buttons -->
    <div class="navbar-actions">
      <button class="btn btn-ghost">Login</button>
      <button class="btn btn-primary">Get Started</button>
    </div>
    
    <!-- Mobile Menu Toggle -->
    <button class="navbar-toggle">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
  </div>
</nav>
```

### Mobile Menu
```html
<div class="mobile-menu">
  <div class="mobile-header">
    <a href="/" class="navbar-brand">
      <div class="logo"><span class="bird-emoji">🐦</span></div>
      <div class="brand-text">
        <h1 class="title">Sarkis.dev</h1>
      </div>
    </a>
    <button class="close-btn">
      <svg>×</svg>
    </button>
  </div>
  
  <nav class="mobile-nav">
    <div class="nav-item">
      <a href="/" class="nav-link">
        <svg class="icon">🏠</svg>
        Home
      </a>
    </div>
    <div class="nav-item">
      <a href="/services" class="nav-link">
        <svg class="icon">⚙️</svg>
        Services
      </a>
    </div>
  </nav>
  
  <div class="mobile-actions">
    <button class="btn btn-outline">Login</button>
    <button class="btn btn-primary">Get Started</button>
  </div>
</div>
```

---

## 🦸 **Hero Section**

### Main Hero
```html
<section class="hero">
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-text">
        <div class="hero-badge">
          <span class="bird-emoji">🐦</span>
          Digital Protection Since 2024
        </div>
        
        <h1 class="hero-title">
          Like the <span class="handwritten">Southern Lapwing</span>,
          <span class="gradient-text">protecting</span> your digital offspring
        </h1>
        
        <p class="hero-tagline">
          We develop secure, efficient solutions that grow with your business. 
          Complete control, transparent costs, open source freedom. 🛡️
        </p>
        
        <div class="hero-actions">
          <button class="btn btn-handwritten">🐦 Access Personal Manager Free</button>
          <button class="btn btn-outline">Learn Our Story</button>
          
          <div class="secondary-info">
            <p>Trusted by businesses worldwide</p>
            <div class="features">
              <span class="feature">
                <svg class="icon">✓</svg>
                100% Open Source
              </span>
              <span class="feature">
                <svg class="icon">✓</svg>
                Complete Ownership
              </span>
              <span class="feature">
                <svg class="icon">✓</svg>
                Zero Vendor Lock-in
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hero-visual">
        <div class="shield-container">
          <div class="shield-bg">
            <div class="shield-content">
              <span class="bird-emoji">🐦</span>
              <p class="shield-text">Protected</p>
            </div>
          </div>
        </div>
        
        <!-- Floating elements -->
        <div class="floating-element element-1">
          <svg class="icon">🔒</svg>
        </div>
        <div class="floating-element element-2">
          <svg class="icon">⚡</svg>
        </div>
        <div class="floating-element element-3">
          <svg class="icon">🛡️</svg>
        </div>
      </div>
    </div>
    
    <!-- Hero Stats -->
    <div class="hero-stats">
      <div class="stat-item">
        <span class="stat-number">100%</span>
        <span class="stat-label">Open Source</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">24/7</span>
        <span class="stat-label">Protection</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">∞</span>
        <span class="stat-label">Scalability</span>
      </div>
    </div>
  </div>
</section>
```

### Hero Variants
```html
<!-- Dark Hero -->
<section class="hero hero-dark">
  <!-- Content... -->
</section>

<!-- Minimal Hero -->
<section class="hero hero-minimal">
  <!-- Content... -->
</section>

<!-- Split Hero with Image -->
<section class="hero hero-split">
  <div class="hero-content">
    <div class="hero-text">...</div>
    <div class="hero-image">
      <img src="hero-image.jpg" alt="Hero">
      <div class="overlay"></div>
    </div>
  </div>
</section>
```

---

## 📱 **Modals**

### Basic Modal
```html
<!-- Modal Backdrop -->
<div class="modal-backdrop show"></div>

<!-- Modal -->
<div class="modal show">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">
        <svg class="icon">🛡️</svg>
        Secure Action Required
      </h3>
      <button class="modal-close">
        <svg>×</svg>
      </button>
    </div>
    
    <div class="modal-body">
      <p>Are you sure you want to proceed with this protected action?</p>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-ghost">Cancel</button>
      <button class="btn btn-primary">Proceed Safely</button>
    </div>
  </div>
</div>
```

### Confirmation Modal
```html
<div class="modal modal-confirm show">
  <div class="modal-content">
    <div class="modal-body">
      <div class="confirm-icon error">
        <svg>⚠️</svg>
      </div>
      <h3>Delete Item</h3>
      <p>This action cannot be undone. Are you sure you want to delete this item?</p>
    </div>
    
    <div class="modal-footer center">
      <button class="btn btn-ghost">Keep Item</button>
      <button class="btn btn-destructive">Delete Forever</button>
    </div>
  </div>
</div>
```

### Drawer Modal (Mobile-First)
```html
<div class="modal modal-drawer show">
  <div class="modal-content">
    <div class="modal-header">
      <h3 class="modal-title">Settings</h3>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body">
      <!-- Settings content -->
    </div>
  </div>
</div>
```

---

## 👇 **Footer**

### Full Footer
```html
<footer class="footer">
  <div class="footer-content">
    <div class="footer-main">
      <!-- Brand Section -->
      <div class="footer-brand">
        <div class="footer-logo">
          <div class="logo">
            <span class="bird-emoji">🐦</span>
          </div>
          <div class="brand-info">
            <h3>Sarkis.dev</h3>
            <p class="tagline">Protecting digital offspring</p>
          </div>
        </div>
        
        <p class="footer-description">
          Like the Southern Lapwing protects its offspring, we protect your data, 
          your investment, and your technological independence.
        </p>
        
        <div class="footer-social">
          <a href="#" class="social-link">
            <svg>📧</svg>
          </a>
          <a href="#" class="social-link">
            <svg>💼</svg>
          </a>
          <a href="#" class="social-link">
            <svg>🐙</svg>
          </a>
        </div>
      </div>
      
      <!-- Services Section -->
      <div class="footer-section">
        <h4>Services</h4>
        <ul class="footer-links">
          <li><a href="/personal-manager">Personal Manager</a></li>
          <li><a href="/custom-software">Custom Software</a></li>
          <li><a href="/hosting">Secure Hosting</a></li>
          <li><a href="/consulting">Tech Consulting</a></li>
        </ul>
      </div>
      
      <!-- Company Section -->
      <div class="footer-section">
        <h4>Company</h4>
        <ul class="footer-links">
          <li><a href="/about">About Us</a></li>
          <li><a href="/values">Our Values</a></li>
          <li><a href="/open-source">Open Source</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      
      <!-- Contact Section -->
      <div class="footer-section footer-contact">
        <h4>Contact</h4>
        <div class="contact-item">
          <svg class="icon">📍</svg>
          <span>Montevideo, Uruguay 🇺🇾</span>
        </div>
        <div class="contact-item">
          <svg class="icon">📧</svg>
          <a href="mailto:hello@sarkis.dev">hello@sarkis.dev</a>
        </div>
        <div class="contact-item">
          <svg class="icon">💬</svg>
          <a href="/contact">Get in Touch</a>
        </div>
      </div>
    </div>
    
    <!-- Newsletter Section -->
    <div class="footer-newsletter">
      <h4>Stay Protected</h4>
      <p>Get updates on new features and security insights.</p>
      <form class="newsletter-form">
        <input type="email" class="form-input" placeholder="your@email.com">
        <button type="submit" class="btn btn-primary">Subscribe</button>
      </form>
    </div>
    
    <!-- Footer Bottom -->
    <div class="footer-bottom">
      <div class="copyright">
        © 2024 Sarkis.dev - Protecting your digital offspring 
        <span class="heart">💙</span>
        <span class="flag">🇺🇾</span>
      </div>
      <div class="footer-legal">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/security">Security</a>
      </div>
    </div>
  </div>
</footer>
```

### Simple Footer
```html
<footer class="footer-simple">
  <div class="footer-content">
    <div class="footer-links">
      <a href="/about">About</a>
      <a href="/services">Services</a>
      <a href="/contact">Contact</a>
      <a href="/privacy">Privacy</a>
    </div>
    <div class="copyright">
      © 2024 Sarkis.dev - Made with 💙 in Uruguay 🇺🇾
    </div>
  </div>
</footer>
```

---

## 🎯 **Utility Classes**

### Layout
```html
<div class="container">Max-width container</div>
<div class="grid">CSS Grid</div>
<div class="flex">Flexbox</div>
<div class="section">Standard section padding</div>
```

### Typography
```html
<p class="font-handwritten">Handwritten text</p>
<p class="font-mono">Monospace text</p>
<p class="text-center">Centered text</p>
<p class="text-primary">Primary color text</p>
<p class="text-muted">Muted text</p>
```

### Animations
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-in">Slides in from left</div>
<div class="animate-protective-glow">Protective glow effect</div>
```

### Responsive
```html
<div class="hide-mobile">Hidden on mobile</div>
<div class="hide-desktop">Hidden on desktop</div>
<div class="show-desktop">Shown only on desktop</div>
```

---

## 🌙 **Dark Mode**

### Activation
```html
<!-- Add to html element -->
<html data-theme="dark">
```

### JavaScript Toggle
```javascript
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

---

## 📱 **Responsive Breakpoints**

```scss
// Mobile First Approach
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## ♿ **Accessibility Features**

### Screen Reader Support
```html
<span class="sr-only">Screen reader only text</span>
```

### Focus Management
```html
<!-- All interactive elements have proper focus styles -->
<button class="btn">Accessible focus ring</button>
```

### High Contrast Support
```scss
@media (prefers-contrast: high) {
  // Enhanced contrast styles automatically applied
}
```

### Reduced Motion
```scss
@media (prefers-reduced-motion: reduce) {
  // Animations disabled automatically
}
```

---

## 🔧 **Customization**

### Override CSS Custom Properties
```scss
:root {
  // Override brand colors
  --color-primary: #your-color;
  --color-secondary: #your-color;
  
  // Override fonts
  --font-handwritten: 'Your-Font', cursive;
  
  // Override spacing
  --space-4: 2rem; // Double the default
}
```

### Extend Components
```scss
// Add new button variant
.btn-custom {
  @extend .btn;
  background: linear-gradient(45deg, #your-colors);
  // Your custom styles
}
```

---

## 🚨 **Important Notes**

### Brand Consistency
- Always use the bird emoji 🐦 in brand contexts
- Maintain the "protective" theme throughout
- Use handwritten font sparingly for impact
- Trust indicators (shields, locks, checks) are key

### Performance
- All fonts are locally hosted (no external requests)
- CSS custom properties enable easy theming
- Minimal animations respect user preferences
- Mobile-first responsive design

### File Size
- Modular imports allow tree-shaking
- Use only needed components
- Optimized for production builds

---

## 🎉 **Examples & Templates**

### Landing Page Template
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sarkis.dev - Protecting Your Digital Offspring</title>
  <link rel="stylesheet" href="styles/global.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar">...</nav>
  
  <!-- Hero -->
  <section class="hero">...</section>
  
  <!-- Benefits -->
  <section class="section">
    <div class="container">
      <div class="card-grid cols-3 animate-stagger">
        <div class="card card-feature">...</div>
        <div class="card card-feature">...</div>
        <div class="card card-feature">...</div>
      </div>
    </div>
  </section>
  
  <!-- Services -->
  <section class="section">
    <div class="container">
      <div class="card-grid cols-2">
        <div class="card card-service popular">...</div>
        <div class="card card-service">...</div>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <footer class="footer">...</footer>
</body>
</html>
```

