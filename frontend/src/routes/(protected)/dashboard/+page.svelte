<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import Dashboard from '$lib/components/auth/Dashboard.svelte';

  // The user will be available from the auth store
  $: user = $auth.user;
  $: isAuthenticated = $auth.isAuthenticated;
</script>

{#if isAuthenticated && user}
  <Dashboard {user}/>
{:else}
  <div>Loading user...</div>
{/if}