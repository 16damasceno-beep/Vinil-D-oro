import { createClient } from '@supabase/supabase-js';

// ==================================================================================
// INSTRUÇÕES PARA ATIVAR O BANCO DE DADOS (ONLINE):
// 1. Crie um projeto gratuito em https://supabase.com
// 2. No painel do Supabase, vá em "Settings" (engrenagem) -> "API".
// 3. Copie a "Project URL" e a chave "anon" / "public".
// 4. Cole nos campos abaixo dentro das aspas.
//
// SE NÃO PREENCHER: O site funcionará em modo "Local" (salva apenas no seu navegador).
// ==================================================================================

const PROJECT_URL: string = ""; // Ex: "https://abcdefgh.supabase.co"
const ANON_KEY: string = "";    // Ex: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Lógica de Inicialização
const hasKeys = PROJECT_URL && ANON_KEY && PROJECT_URL.length > 10;

export const supabase = hasKeys 
  ? createClient(PROJECT_URL, ANON_KEY)
  : null;

if (!hasKeys) {
  console.log("⚠️ Supabase não configurado. Rodando em modo LocalStorage (Offline).");
}

// Helper para salvar dados (Funciona apenas se o supabase estiver ativo)
export const dbUpsert = async (table: string, item: any) => {
  if (!supabase) return; // Se não tiver chaves, não faz nada (o store usa LocalStorage)
  
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
