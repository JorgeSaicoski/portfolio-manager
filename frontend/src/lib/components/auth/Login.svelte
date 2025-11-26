<script lang="ts">
  import { auth } from '../../stores/auth';

  let loading = false;
  let error = '';

  // Handle login - redirect to Authentik
  async function handleLogin() {
    loading = true;
    error = '';

    try {
      await auth.login();
      // User will be redirected to Authentik, no need to call onLoginSuccess here
    } catch (err) {
      console.error('Login error:', err);
      error = 'Failed to initiate login. Please try again.';
      loading = false;
    }
  }
</script>

<div class="container">
  <div class="form-card">
    <div class="form-header">
      <div class="logo">
        🔐
      </div>
      <h2>Welcome</h2>
      <p>Sign in to access your portfolio</p>
    </div>

    <div class="login-form">
      <!-- Error Message -->
      {#if error}
        <div class="form-error">
          <svg class="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      {/if}

      <div class="form-actions">
        <!-- Login Button -->
        <button
          type="button"
          class="btn btn-primary btn-block"
          onclick={handleLogin}
          disabled={loading}
        >
          {#if loading}
            <div style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
            Redirecting to Login...
          {:else}
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Sign In with Authentik
          {/if}
        </button>

      </div>

      <div class="info-box">
        <p><strong>Secure Authentication</strong></p>
        <p>You'll be redirected to our secure authentication provider to sign in.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .form-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 40px;
    max-width: 420px;
    width: 100%;
  }

  .form-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .logo {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 8px 0;
  }

  .form-header p {
    color: #718096;
    font-size: 16px;
    margin: 0;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-error {
    background: #fed7d7;
    border: 1px solid #fc8181;
    color: #c53030;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon {
    flex-shrink: 0;
  }

  .form-actions {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    padding: 14px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-primary:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  .btn-block {
    width: 100%;
  }

  .info-box {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }

  .info-box p {
    margin: 0;
    font-size: 14px;
    color: #4a5568;
  }

  .info-box p:first-child {
    font-weight: 600;
    margin-bottom: 4px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .form-card {
      padding: 24px;
    }

    .logo {
      font-size: 48px;
    }

    h2 {
      font-size: 24px;
    }
  }
</style>
