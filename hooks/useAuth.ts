import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { useEffect, useState } from 'react';
import usersData from '../assets/data/users.json';

export type UserType = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  profile_picture_url: string;
  bio: string;
  birth_date: string;
  gender: boolean;
  preferred_language: string;
  preferred_timezone: string;
  last_location_lat: number;
  last_location_lng: number;
  social_credit: number;
  last_login: string;
  created_at: string;
  deleted_at: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>(usersData);

  // Load persisted user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('currentUser');
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error loading stored user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // --- LOGIN ---
  const login = async (email: string, password: string) => {
    const foundUser = users.find(u => u.email === email);
    if (!foundUser) return false;

    const inputHash = CryptoJS.SHA256(password).toString();
    if (inputHash !== foundUser.password_hash) return false;

    setUser(foundUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(foundUser));
    return true;
  };

  // --- SIGNUP ---
  const signup = async (username: string, email: string, password: string) => {
    const exists = users.find(u => u.email === email);
    if (exists) return false;

    const password_hash = CryptoJS.SHA256(password).toString();
    const newUser: UserType = {
      id: Date.now(),
      username,
      email,
      password_hash,
      profile_picture_url: '',
      bio: '',
      birth_date: '',
      gender: true,
      preferred_language: 'en',
      preferred_timezone: 'UTC',
      last_location_lat: 0,
      last_location_lng: 0,
      social_credit: 0,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      deleted_at: null,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);

    // Store new user session
    setUser(newUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));

    // ⚠️ NOTE: This won’t modify the JSON file at runtime (Expo can’t write to /assets)
    // You’d normally send it to a backend or local database.
    return true;
  };

  // --- LOGOUT ---
  const logout = async () => {
    await AsyncStorage.removeItem('currentUser');
    setUser(null);
  };

  return { user, loading, login, signup, logout };
}
