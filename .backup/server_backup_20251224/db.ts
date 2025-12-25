import { getSupabase } from "./supabase";
import { ENV } from './_core/env';

export type User = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

export type InsertUser = {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: 'user' | 'admin';
  lastSignedIn?: Date;
};

// Lazily get the Supabase client
export async function getDb() {
  try {
    return getSupabase();
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const supabase = await getDb();
  if (!supabase) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('open_id', user.openId)
      .single();

    const userData: any = {
      open_id: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      login_method: user.loginMethod ?? null,
      last_signed_in: user.lastSignedIn ? user.lastSignedIn.toISOString() : new Date().toISOString(),
    };

    // Set role
    if (user.role !== undefined) {
      userData.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      userData.role = 'admin';
    } else if (!existingUser) {
      userData.role = 'user';
    }

    if (existingUser) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('open_id', user.openId);

      if (error) {
        console.error("[Database] Failed to update user:", error);
        throw error;
      }
    } else {
      // Insert new user
      const { error } = await supabase
        .from('users')
        .insert(userData);

      if (error) {
        console.error("[Database] Failed to insert user:", error);
        throw error;
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const supabase = await getDb();
  if (!supabase) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('open_id', openId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return undefined;
    }
    console.error("[Database] Failed to get user:", error);
    return undefined;
  }

  return data ? {
    id: data.id,
    open_id: data.open_id,
    name: data.name,
    email: data.email,
    login_method: data.login_method,
    role: data.role,
    created_at: data.created_at,
    updated_at: data.updated_at,
    last_signed_in: data.last_signed_in,
  } : undefined;
}

// TODO: add feature queries here as your schema grows.
