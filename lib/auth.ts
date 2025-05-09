// lib/auth.ts
import { supabase } from './supabase';

export const signUp = async (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signIn = async (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const getCurrentUser = () => supabase.auth.getUser();

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};