<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  interface LayoutData {
    user: {
      id: number;
      username: string;
      email: string;
      created_at: string;
      updated_at: string;
    };
    token?: string;
  }

  interface Props {
    children: import('svelte').Snippet;
    data: LayoutData;
  }

  let { children, data }: Props = $props();

  // Initialize auth store with server data
  onMount(() => {
    // The auth store is already initialized from cookies via auth.init()
    // Server-side validation ensures the user is authenticated
    // No need to call setAuth again as it would require access_token, id_token, and user
  });

  function handleLogout() {
    auth.logout();
  }
</script>

<div class="protected-layout">
  <header>
    <h1>Admin</h1>
    {#if data.user}
      <span>Welcome, {data.user.username}!</span>
    {/if}
    <button onclick={handleLogout}>Logout</button>
  </header>
  
  <main>
    {@render children?.()}
  </main>
</div>

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