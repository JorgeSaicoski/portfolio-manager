<script lang="ts">
  import { goto } from "$app/navigation";
  import Login from "$lib/components/auth/Login.svelte";
  import { auth } from "$lib/stores/auth";

  function handleLoginSuccess() {
    console.log("handleLoginSuccess called");
    console.log("Auth state before navigation:", $auth);
    goto("/dashboard");
    console.log("Navigation called");
  }
  function handleShowRegister() {
    goto("/auth/register");
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
