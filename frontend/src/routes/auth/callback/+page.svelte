<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';

  let loading = true;
  let error = '';
  let success = false;

  onMount(async () => {
    // Get code and state from URL params
    const code = $page.url.searchParams.get('code');
    const state = $page.url.searchParams.get('state');
    const errorParam = $page.url.searchParams.get('error');
    const errorDescription = $page.url.searchParams.get('error_description');

    // Handle error from Authentik
    if (errorParam) {
      error = errorDescription || errorParam;
      loading = false;
      return;
    }

    // Validate required parameters
    if (!code || !state) {
      error = 'Missing authentication parameters';
      loading = false;
      return;
    }

    try {
      // Exchange code for tokens
      const result = await auth.handleCallback(code, state);

      if (result.success) {
        success = true;
        // Redirect to dashboard after short delay
        setTimeout(() => {
          goto('/dashboard');
        }, 1500);
      } else {
        error = result.error || 'Authentication failed';
      }
    } catch (err: unknown) {
      console.error('Callback error:', err);
      error = 'An error occurred during authentication';
    } finally {
      loading = false;
    }
  });
</script>

<div class="container">
  <div class="card">
    {#if loading}
      <div class="content">
        <div class="spinner"></div>
        <h2>Completing Sign In...</h2>
        <p>Please wait while we verify your authentication.</p>
      </div>
    {:else if success}
      <div class="content">
        <div class="success-icon">✓</div>
        <h2>Success!</h2>
        <p>You've been successfully authenticated. Redirecting...</p>
      </div>
    {:else if error}
      <div class="content">
        <div class="error-icon">✗</div>
        <h2>Authentication Failed</h2>
        <p class="error-message">{error}</p>
        <button class="btn" on:click={() => goto('/auth/login')}>
          Try Again
        </button>
      </div>
    {/if}
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

  .card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 60px 40px;
    max-width: 480px;
    width: 100%;
  }

  .content {
    text-align: center;
  }

  .spinner {
    width: 64px;
    height: 64px;
    border: 6px solid #e2e8f0;
    border-top: 6px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }

  .success-icon {
    width: 80px;
    height: 80px;
    background: #48bb78;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    margin: 0 auto 24px;
    animation: scaleIn 0.5s ease-out;
  }

  .error-icon {
    width: 80px;
    height: 80px;
    background: #f56565;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    margin: 0 auto 24px;
  }

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 12px 0;
  }

  p {
    color: #718096;
    font-size: 16px;
    margin: 0 0 24px 0;
    line-height: 1.6;
  }

  .error-message {
    color: #e53e3e;
    font-weight: 500;
  }

  .btn {
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    padding: 14px 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes scaleIn {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    .card {
      padding: 40px 24px;
    }

    h2 {
      font-size: 24px;
    }

    .spinner,
    .success-icon,
    .error-icon {
      width: 60px;
      height: 60px;
      font-size: 36px;
    }
  }
</style>
