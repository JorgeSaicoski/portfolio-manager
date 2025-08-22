<!-- AuthWrapper.svelte -->
<script lang="ts">
  import { auth } from '../stores/auth';
  
  // Import your login and register components
  import Login from './Login.svelte';
  import Register from './Register.svelte';

  // Props for event callbacks
  export let onAuthSuccess: ((data: { token: string; user: any }) => void) | undefined = undefined;

  // Component state
  let currentView = 'login'; // 'login' | 'register'
  let isTransitioning = false;

  // Subscribe to auth store
  $: ({ isAuthenticated, user, loading, error } = $auth);

  // Handle successful authentication
  function handleAuthSuccess(data: { token: string; user: any }) {
    const { token, user } = data;
    
    // Update auth store
    auth.setAuth(token, user);
    
    // Call parent callback
    onAuthSuccess?.(data);
  }

  // Handle view transitions
  function showLogin() {
    if (currentView !== 'login') {
      isTransitioning = true;
      setTimeout(() => {
        currentView = 'login';
        isTransitioning = false;
      }, 150);
    }
  }

  function showRegister() {
    if (currentView !== 'register') {
      isTransitioning = true;
      setTimeout(() => {
        currentView = 'register';
        isTransitioning = false;
      }, 150);
    }
  }
</script>

<div class="auth-wrapper" class:transitioning={isTransitioning}>
  {#if currentView === 'login'}
    <div class="auth-view" class:visible={!isTransitioning}>
      <Login 
        onLoginSuccess={handleAuthSuccess}
        onShowRegister={showRegister}
      />
    </div>
  {:else if currentView === 'register'}
    <div class="auth-view" class:visible={!isTransitioning}>
      <Register 
        onRegisterSuccess={handleAuthSuccess}
        onShowLogin={showLogin}
      />
    </div>
  {/if}
</div>

<style>
  .auth-wrapper {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .auth-view {
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease-in-out;
  }

  .auth-view.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .auth-wrapper.transitioning .auth-view {
    opacity: 0;
    transform: translateY(-20px);
  }
</style>