import { supabase } from './supabase';

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signInAnonymously = () => 
  supabase.auth.signInAnonymously();

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const getCurrentUser = () => 
  supabase.auth.getUser();

export const signOut = () => 
  supabase.auth.signOut();

export const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email);

// Helper to get the current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};