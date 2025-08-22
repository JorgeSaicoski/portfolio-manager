<script>
  import { goto } from '$app/navigation';

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<div class="welcome-container">
  <div class="welcome-content">
    <h1>Welcome to Portfolio Manager</h1>
    <p>Manage your portfolio with ease and confidence.</p>
    
    <button on:click={goToDashboard} class="dashboard-button">
      Go to Dashboard
    </button>
  </div>
</div>

<style>
  .welcome-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }

  .welcome-content {
    text-align: center;
    color: white;
    max-width: 500px;
  }

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 1.25rem;
    margin: 0 0 2rem 0;
    opacity: 0.9;
  }

  .dashboard-button {
    background: white;
    color: #667eea;
    border: none;
    border-radius: 8px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .dashboard-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
    }
    
    .welcome-container {
      padding: 1rem;
    }
  }
</style>