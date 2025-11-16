<script>
  import { goto } from '$app/navigation';

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<section class="hero hero-dark">
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title handwritten">Welcome to Portfolio Manager</h1>
        <p class="hero-tagline">Manage your portfolio with ease and confidence.</p>
        
        <div class="hero-actions">
          <button on:click={goToDashboard} class="btn btn-handwritten">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</section>