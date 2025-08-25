<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let { children } = $props();

  // Use your existing auth store
  $effect(() => {
    if (!$auth.isAuthenticated) {
      goto('/auth/login');
    }
  });

  function handleLogout() {
    auth.logout();
  }
</script>

{#if $auth.isAuthenticated}
  <div class="protected-layout">
    <header>
      <h1>Protected Area</h1>
      {#if $auth.user}
        <span>Welcome, {$auth.user.username}!</span>
      {/if}
      <button onclick={handleLogout}>Logout</button>
    </header>
    
    <main>
      {@render children?.()}
    </main>
  </div>
{:else}
  <div>Loading...</div>
{/if}

<style>
  .protected-layout {
    min-height: 100vh;
  }
  header {
    padding: 1rem;
    background: #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  main {
    padding: 2rem;
  }
</style>