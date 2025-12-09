<script lang="ts">
  import { goto } from "$app/navigation";
  import Login from "$lib/components/auth/Login.svelte";

  function handleLoginSuccess() {
    // Navigation after successful login
    goto("/dashboard");
  }
</script>

<svelte:head>
  <title>Login</title>
  <meta name="description" content="Sign in to your account" />
</svelte:head>

<Login
  onLoginSuccess={handleLoginSuccess}
/>
