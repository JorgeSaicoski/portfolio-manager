<script lang="ts">
  import { auth } from "$lib/stores/auth";

  // Props for event callbacks
  export let onRegisterSuccess: (() => void) | undefined = undefined;
  export let onShowLogin: (() => void) | undefined = undefined;

  // Form state
  let username = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let loading = false;
  let error = "";
  let showPassword = false;
  let showConfirmPassword = false;

  // Validation state
  let usernameError = "";
  let emailError = "";
  let passwordError = "";
  let confirmPasswordError = "";


  // Email validation
  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Username validation
  function validateUsername(username: string) {
    return username.length >= 3 && username.length <= 50;
  }

  // Password validation
  function validatePassword(password: string) {
    return password.length >= 6;
  }

  // Validate form fields
  function validateForm() {
    usernameError = "";
    emailError = "";
    passwordError = "";
    confirmPasswordError = "";

    if (!username) {
      usernameError = "Username is required";
    } else if (!validateUsername(username)) {
      usernameError = "Username must be between 3 and 50 characters";
    }

    if (!email) {
      emailError = "Email is required";
    } else if (!validateEmail(email)) {
      emailError = "Please enter a valid email address";
    }

    if (!password) {
      passwordError = "Password is required";
    } else if (!validatePassword(password)) {
      passwordError = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      confirmPasswordError = "Please confirm your password";
    } else if (password !== confirmPassword) {
      confirmPasswordError = "Passwords do not match";
    }

    return (
      !usernameError && !emailError && !passwordError && !confirmPasswordError
    );
  }

  // Handle register submission
  async function handleRegister() {
    if (!validateForm()) {
      return;
    }

    loading = true;
    error = "";

    try {
      const result = await auth.register(username.trim(), email.trim(), password);
      if (result.success){
        // Dispatch success event
        onRegisterSuccess?.();
      }
      
    } catch (err) {
      error = (err as Error).message || "fallback message";
    } finally {
      loading = false;
    }
  }

  // Handle login redirect
  function handleLoginClick() {
    onShowLogin?.();
  }

  // Toggle password visibility
  function togglePassword() {
    showPassword = !showPassword;
  }

  function toggleConfirmPassword() {
    showConfirmPassword = !showConfirmPassword;
  }

  // Handle enter key press
  function handleKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      handleRegister();
    }
  }

  // Real-time validation
  $: if (username) {
    usernameError = validateUsername(username)
      ? ""
      : "Username must be between 3 and 50 characters";
  }

  $: if (email) {
    emailError = validateEmail(email)
      ? ""
      : "Please enter a valid email address";
  }

  $: if (password) {
    passwordError = validatePassword(password)
      ? ""
      : "Password must be at least 6 characters";
  }

  $: if (confirmPassword && password) {
    confirmPasswordError =
      password === confirmPassword ? "" : "Passwords do not match";
  }
</script>

<div class="container">
  <div class="form-card">
    <div class="form-header">
      <div class="logo">
        🐦
      </div>
      <h2>Create Account</h2>
      <p>Join our secure community</p>
    </div>

    <form class="register-form" on:submit={handleRegister}>
      <!-- Username Field -->
      <div class="form-group">
        <label class="form-label" for="username">
          Username <span class="required">*</span>
        </label>
        <div class="form-input-icon">
          <svg class="icon" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <input
            id="username"
            type="text"
            bind:value={username}
            on:keypress={handleKeyPress}
            placeholder="Choose a username"
            class="form-input"
            class:error={usernameError}
            disabled={loading}
            autocomplete="username"
          />
        </div>
        {#if usernameError}
          <div class="form-error">
            <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {usernameError}
          </div>
        {/if}
      </div>

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
            placeholder="Create a password"
            class="form-input"
            class:error={passwordError}
            disabled={loading}
            autocomplete="new-password"
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

      <!-- Confirm Password Field -->
      <div class="form-group">
        <label class="form-label" for="confirmPassword">
          Confirm Password <span class="required">*</span>
        </label>
        <div class="form-input-icon icon-right">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            bind:value={confirmPassword}
            on:keypress={handleKeyPress}
            placeholder="Confirm your password"
            class="form-input"
            class:error={confirmPasswordError}
            disabled={loading}
            autocomplete="new-password"
          />
          <button
            type="button"
            class="icon"
            on:click={toggleConfirmPassword}
            disabled={loading}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            style="background: none; border: none; cursor: pointer;"
          >
            {#if showConfirmPassword}
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
        {#if confirmPasswordError}
          <div class="form-error">
            <svg class="icon" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {confirmPasswordError}
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
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>
    </form>

    <div class="form-footer">
      <p>
        Already have an account?
        <button
          type="button"
          class="btn btn-ghost"
          style="padding: 0; height: auto; font-size: inherit;"
          on:click={handleLoginClick}
          disabled={loading}
        >
          Sign in
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
