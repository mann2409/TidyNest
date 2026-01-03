import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_URL || 'https://rppuasibduwtnnofjavm.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY || 'MISSING_KEY';

if (supabaseAnonKey === 'MISSING_KEY') {
  console.error('CRITICAL: Supabase Anon Key is missing! The app will crash or fail to auth.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to sync containers
export async function syncContainer(container: any) {
  const { data, error } = await supabase
    .from('containers')
    .upsert({
      id: container.id,
      code: container.code,
      location_id: container.locationId,
      category: container.category,
      description: container.description,
      photo_url: container.photoUrl,
      updated_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error('Error syncing container:', error);
    return { error };
  }
  return { data };
}
