<script lang="ts">
  import { goto } from '$app/navigation';
  import Login from '$lib/components/auth/Login.svelte';

  function handleLoginSuccess() { 
    goto('/dashboard');
  }
  function handleShowRegister(){
    goto('/auth/register');
  }
</script>

<svelte:head>
  <title>Login</title>
  <meta name="description" content="Sign in to your account" />
</svelte:head>

<Login 
  onLoginSuccess={handleLoginSuccess}
  onShowRegister={handleShowRegister}
/>
