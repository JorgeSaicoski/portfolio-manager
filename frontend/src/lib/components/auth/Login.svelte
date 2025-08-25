<script lang="ts">
  import { goto } from "$app/navigation";

  // Props for event callbacks
  export let onLoginSuccess:
    | ((data: { token: string; user: any }) => void)
    | undefined = undefined;
  export let onShowRegister: (() => void) | undefined = undefined;

  // Form state
  let email = "";
  let password = "";
  let loading = false;
  let error = "";
  let showPassword = false;

  // Validation state
  let emailError = "";
  let passwordError = "";

  // Auth API base URL - adjust this to match your backend
  const AUTH_API_URL = "http://localhost:8001/api/auth";

  // Email validation
  function validateEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate form fields
  function validateForm() {
    emailError = "";
    passwordError = "";

    if (!email) {
      emailError = "Email is required";
    } else if (!validateEmail(email)) {
      emailError = "Please enter a valid email address";
    }

    if (!password) {
      passwordError = "Password is required";
    } else if (password.length < 6) {
      passwordError = "Password must be at least 6 characters";
    }

    return !emailError && !passwordError;
  }

  // Handle login submission
  async function handleLogin() {
    if (!validateForm()) {
      return;
    }

    loading = true;
    error = "";

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token in localStorage (you might want to use a more secure approach)
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Dispatch success event
      onLoginSuccess?.({
        token: data.token,
        user: data.user,
      });
      goto('/dashboard');
    } catch (err) {
      error = err instanceof Error ? err.message : "fallback message";
    } finally {
      loading = false;
    }
  }

  // Handle register redirect
  function handleRegisterClick() {
    onShowRegister?.();
  }

  // Toggle password visibility
  function togglePassword() {
    showPassword = !showPassword;
  }

  // Handle enter key press
  function handleKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>Welcome Back</h1>
      <p>Sign in to your account</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="login-form">
      <!-- Email Field -->
      <div class="form-group">
        <label for="email" class="form-label">Email Address</label>
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
        {#if emailError}
          <span class="error-message">{emailError}</span>
        {/if}
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-field">
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
            class="password-toggle"
            on:click={togglePassword}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {#if showPassword}
              <!-- Eye slash icon -->
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                />
              </svg>
            {:else}
              <!-- Eye icon -->
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                />
              </svg>
            {/if}
          </button>
        </div>
        {#if passwordError}
          <span class="error-message">{passwordError}</span>
        {/if}
      </div>

      <!-- Error Message -->
      {#if error}
        <div class="alert error-alert">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          {error}
        </div>
      {/if}

      <!-- Submit Button -->
      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          <div class="loading-spinner"></div>
          Signing In...
        {:else}
          Sign In
        {/if}
      </button>
    </form>

    <!-- Register Link -->
    <div class="register-link">
      <p>
        Don't have an account?
        <button
          type="button"
          class="link-button"
          on:click={handleRegisterClick}
          disabled={loading}
        >
          Create one
        </button>
      </p>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .login-card {
    background: white;
    border-radius: 16px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.5rem 0;
  }

  .login-header p {
    color: #6b7280;
    margin: 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .form-input {
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    outline: none;
  }

  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-input.error {
    border-color: #ef4444;
  }

  .form-input:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .password-field {
    position: relative;
  }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .password-toggle:hover {
    color: #374151;
  }

  .password-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .alert {
    padding: 0.75rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .error-alert {
    background-color: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .submit-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.875rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .register-link {
    text-align: center;
    margin-top: 1.5rem;
  }

  .register-link p {
    color: #6b7280;
    margin: 0;
  }

  .link-button {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
    padding: 0;
    margin-left: 0.25rem;
  }

  .link-button:hover:not(:disabled) {
    color: #5a67d8;
  }

  .link-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .login-container {
      padding: 0.5rem;
    }

    .login-card {
      padding: 1.5rem;
    }

    .login-header h1 {
      font-size: 1.5rem;
    }
  }
</style>
