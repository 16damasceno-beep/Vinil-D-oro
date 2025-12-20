
import { createClient } from '@supabase/supabase-js';

// ==================================================================================
// PARA HOSPEDAR E USAR O SITE REALMENTE:
// 1. Crie uma conta em supabase.com
// 2. Crie um projeto e copie a URL e a Anon Key abaixo.
// 3. Sem isso, o site só salva dados localmente no seu navegador atual.
// ==================================================================================

const PROJECT_URL: string = ""; // Insira aqui sua URL do Supabase
const ANON_KEY: string = "";    // Insira aqui sua Chave Anon do Supabase

const hasKeys = PROJECT_URL && ANON_KEY && PROJECT_URL.length > 10;

export const supabase = hasKeys 
  ? createClient(PROJECT_URL, ANON_KEY)
  : null;

export const dbUpsert = async (table: string, item: any) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(table)
      .upsert({ id: item.id, data: item }, { onConflict: 'id' });
    if (error) console.error(`Erro Supabase (${table}):`, error);
  } catch (err) {
    console.error("Erro DB:", err);
  }
};

export const dbDelete = async (table: string, id: string) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Erro Delete Supabase (${table}):`, error);
  } catch (err) {
    console.error("Erro DB Delete:", err);
  }
};
