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
    children: any;
    data: LayoutData;
  }

  let { children, data }: Props = $props();

  // Initialize auth store with server data
  onMount(() => {
    if (data.user && data.token) {
      // Update client store with server data
      auth.setAuth(data.token, data.user);
    }
  });

  function handleLogout() {
    auth.logout();
  }
</script>

<div class="protected-layout">
  <header>
    <h1>Protected Area</h1>
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