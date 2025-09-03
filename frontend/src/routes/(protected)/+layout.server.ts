import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }: RequestEvent) => {
  const token = cookies.get('auth-token');
  const userStr = cookies.get('auth-user');
  
  if (!token || !userStr) {
    throw redirect(302, '/auth/login');
  }

  // Basic token validation
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) {
      // Token expired - clear cookies and redirect
      cookies.delete('auth-token', { path: '/' });
      cookies.delete('auth-user', { path: '/' });
      throw redirect(302, '/auth/login');
    }
    
    // Parse user data
    const user = JSON.parse(userStr);
    
    // Return user data to client
    return {
      user,
      token // Optional: if you want to pass token to client
    };
  } catch (error) {
    // Invalid token/user data - clear cookies and redirect
    cookies.delete('auth-token', { path: '/' });
    cookies.delete('auth-user', { path: '/' });
    throw redirect(302, '/auth/login');
  }
};