import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const getIsAdmin = async (userId: string): Promise<boolean> => {
  // You would implement admin check logic here, for example:
  // 1. Check against an 'admins' table
  // 2. Query for specific roles
  // For now, we'll use a simple check assuming there's an admin_users table
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};
