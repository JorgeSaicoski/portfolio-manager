<script>
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  const AUTHENTIK_URL = import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:9000';

  function goToDashboard() {
    goto('/dashboard');
  }

  async function handleSignIn() {
    await auth.login();
  }

  function handleSignUp() {
    window.location.href = `${AUTHENTIK_URL}/if/flow/default-enrollment-flow/`;
  }
</script>

<section class="hero hero-dark">
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title handwritten">Welcome to Portfolio Manager</h1>
        <p class="hero-tagline">Manage your portfolio with ease and confidence.</p>
        
        <div class="hero-actions">
          <button on:click={handleSignIn} class="btn btn-primary btn-handwritten">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Sign In
          </button>
          <button on:click={handleSignUp} class="btn btn-secondary btn-handwritten">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            Sign Up
          </button>
          <button on:click={goToDashboard} class="btn btn-tertiary btn-handwritten">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</section>