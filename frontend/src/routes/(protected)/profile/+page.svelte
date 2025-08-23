<script lang="ts">
  import ProfileModal from '$lib/components/auth/ProfileModal.svelte';
  import { auth } from '$lib/stores/auth';


  // The user will be available from the auth store
  $: user = $auth.user;
  $: isAuthenticated = $auth.isAuthenticated;
</script>

{#if isAuthenticated && user}
  <ProfileModal {user}  />
{:else}
  <div>Loading user...</div>
{/if}