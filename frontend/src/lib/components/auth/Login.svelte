<script lang="ts">
  import { auth } from '../../stores/auth';

  // Props
  export let onLoginSuccess: ((data: { token: string; user: any }) => void) | undefined = undefined;
  export let onShowRegister: (() => void) | undefined = undefined;

  // Form data
  let email = '';
  let password = '';
  let showPassword = false;
  let loading = false;
  let error = '';
  let emailError = '';
  let passwordError = '';

  // Validate email
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate form
  function validateForm(): boolean {
    let isValid = true;
    emailError = '';
    passwordError = '';

    if (!email.trim()) {
      emailError = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      emailError = 'Please enter a valid email';
      isValid = false;
    }

    if (!password) {
      passwordError = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      passwordError = 'Password must be at least 6 characters';
      isValid = false;
    }

    return isValid;
  }

  // Handle login
  async function handleLogin(event: Event) {
    event.preventDefault();
    
    if (!validateForm()) return;

    loading = true;
    error = '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        onLoginSuccess?.(data);
      } else {
        error = data.error || 'Login failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Handle key press
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin(event);
    }
  }

  // Toggle password visibility
  function togglePassword() {
    showPassword = !showPassword;
  }

  // Handle register click
  function handleRegisterClick() {
    onShowRegister?.();
  }
</script>

<div class="container">
  <div class="form-card">
    <div class="form-header">
      <div class="logo">
        🐦
      </div>
      <h2>Welcome Back</h2>
      <p>Sign in to your protected space</p>
    </div>

    <form class="login-form" on:submit={handleLogin}>
      <!-- Email Field -->
      <div class="form-group">
        <label class="form-label" for="email">
          Email <span class="required">*</span>
        </label>
        <div class="form-input-icon">
          <svg class="icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <input
            id="email"
            type="email"
            bind:value={email}
            on:keypress={handleKeyPress}
            placeholder="Enter your email"
            class="form-input"
            class:error={emailError}
            disabled={loading}
            autocomplete="email"
          />
        </div>
        {#if emailError}
          <div class="form-error">
            <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {emailError}
          </div>
        {/if}
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label class="form-label" for="password">
          Password <span class="required">*</span>
        </label>
        <div class="form-input-icon icon-right">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            bind:value={password}
            on:keypress={handleKeyPress}
            placeholder="Enter your password"
            class="form-input"
            class:error={passwordError}
            disabled={loading}
            autocomplete="current-password"
          />
          <button
            type="button"
            class="icon"
            on:click={togglePassword}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style="background: none; border: none; cursor: pointer;"
          >
            {#if showPassword}
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
            {:else}
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            {/if}
          </button>
        </div>
        {#if passwordError}
          <div class="form-error">
            <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {passwordError}
          </div>
        {/if}
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="form-error">
          <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {error}
        </div>
      {/if}

      <div class="form-actions">
        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary btn-block" disabled={loading}>
          {#if loading}
            <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
            Signing In...
          {:else}
            Sign In Securely
          {/if}
        </button>
        
        <div class="forgot-password">
          <a href="#" style="color: var(--color-primary-dark); text-decoration: none;">Forgot your password?</a>
        </div>
      </div>
    </form>

    <div class="form-footer">
      <p>
        Don't have an account?
        <button
          type="button"
          class="btn btn-ghost"
          style="padding: 0; height: auto; font-size: inherit;"
          on:click={handleRegisterClick}
          disabled={loading}
        >
          Sign up here
        </button>
      </p>
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>