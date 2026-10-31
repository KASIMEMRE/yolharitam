// Kullanıcı engelleme. Kurallar veritabanında (migration: moderation_block):
// engellenince aradaki arkadaşlık silinir, birbirinizin vitrin projelerini ve lig satırını görmezsiniz,
// birbirinize arkadaşlık isteği gönderemezsiniz.
import { supabase } from '@/lib/supabase';

export type BlockedUser = { user_id: string; username: string | null; created_at: string };

// 'ok' = engellendi (zaten engelliyse de başarı sayılır) · 'limit' = engel sınırı doldu · 'error' = kaydedilemedi
export async function blockUser(userId: string): Promise<'ok' | 'limit' | 'error'> {
  try {
    const { data } = await supabase.auth.getSession(); // yerel okuma
    const me = data.session?.user.id;
    if (!me || me === userId) return 'error';
    const { error } = await supabase.from('blocked_users').insert({ blocker: me, blocked: userId });
    if (!error || error.code === '23505') return 'ok';
    if (error.message?.includes('block_limit')) return 'limit';
    return 'error';
  } catch {
    return 'error';
  }
}

export async function unblockUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('blocked_users').delete().eq('blocked', userId);
    return !error;
  } catch {
    return false;
  }
}

// null = okunamadı
export async function listBlocked(): Promise<BlockedUser[] | null> {
  try {
    const { data, error } = await supabase.rpc('blocked_list');
    if (error) return null;
    return (data ?? []) as BlockedUser[];
  } catch {
    return null;
  }
}
