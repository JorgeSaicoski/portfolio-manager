<script lang="ts">
  import { goto } from '$app/navigation';
  import Register from '$lib/components/auth/Register.svelte';

  function handleRegisterSuccess(){
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Register</title>
  <meta name="description" content="Create your account" />
</svelte:head>

<Register 
  onRegisterSuccess = {handleRegisterSuccess}
/> 