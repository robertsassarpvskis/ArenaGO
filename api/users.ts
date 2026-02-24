import { API_BASE_URL } from './config';
import { User } from './types';



export async function getUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch error in getUsers:', err);
    throw err;
  }
}


export async function getUserByID(id: string): Promise<User> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json(); // single user object
  } catch (err) {
    console.error('Fetch error in getUserByID:', err);
    throw err;
  }
}

// Try to fetch the current authenticated user using the access token (Bearer)
export async function getCurrentUser(accessToken?: string): Promise<User> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${API_BASE_URL}/users/me`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch error in getCurrentUser:', err);
    throw err;
  }
}

