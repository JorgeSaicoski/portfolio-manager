<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import Dashboard from '$lib/components/auth/Dashboard.svelte';

  // Add debugging using $effect for Svelte 5
  $effect(() => {
    console.log('Dashboard page - Auth state:', {
      isAuthenticated: $auth.isAuthenticated,
      user: $auth.user
    });
  });

  // These can stay as regular reactive assignments in Svelte 5
  let user = $derived($auth.user);
  let isAuthenticated = $derived($auth.isAuthenticated);
</script>

{#if isAuthenticated && user}
  <Dashboard {user}/>
{:else}
  <div>Dashboard loading user... Auth: {isAuthenticated}, User: {user}</div>
{/if}