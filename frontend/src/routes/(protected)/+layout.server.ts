import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }: RequestEvent) => {
  const token = cookies.get('auth-token');
  
  if (!token) {
    throw redirect(302, '/login');
  }

  // Basic token validation
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) {
      cookies.delete('auth-token', { path: '/' });
      throw redirect(302, '/login');
    }
  } catch {
    cookies.delete('auth-token', { path: '/' });
    throw redirect(302, '/login');
  }

  return {};
};