// =============================================
// CONFIGURAÇÃO GLOBAL DA PLATAFORMA
// Compatibilidade: GitHub Pages / Power Pages
// =============================================

const CONFIG = {
  // ==========================================
  // AMBIENTE
  // ==========================================
  // Alterar para 'powerpages' quando migrar para Power Pages
  ENVIRONMENT: 'supabase', // 'supabase' | 'powerpages' | 'mock'
  
  // ==========================================
  // SUPABASE (GitHub Pages)
  // ==========================================
  SUPABASE: {
    URL: 'https://yujhfscnnngaivwwunom.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhmc2Nubm5nYWl2d3d1bm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODA5OTEsImV4cCI6MjA4MDk1Njk5MX0.wpWiNx6ck_gEujMoodbFTswjBjMbuEHeAO8lMtLes2c'
  },
  
  // ==========================================
  // POWER PAGES (Microsoft Dataverse)
  // Descomentar e configurar quando migrar
  // ==========================================
  // POWERPAGES: {
  //   API_URL: '/_api',  // URL base da Web API do Dataverse
  //   // Mapeamento de tabelas Supabase -> Dataverse
  //   TABLE_MAP: {
  //     'colaboradores': 'cr_colaboradores',
  //     'departamentos': 'cr_departamentos',
  //     'formacoes': 'cr_formacoes',
  //     'formacao_sessoes': 'cr_formacaosessoes',
  //     'formacao_inscricoes': 'cr_formacaoinscricoes',
  //     // ... adicionar mais mapeamentos
  //   }
  // },
  
  // ==========================================
  // CONFIGURAÇÕES DA APLICAÇÃO
  // ==========================================
  APP: {
    // ID do utilizador atual (simulação - em produção virá da autenticação)
    // Carla Santos - colaboradora de IT
    CURRENT_USER_ID: '2a9c8535-0440-4ab8-9230-3a97441e3581',
    
    // Locale
    LOCALE: 'pt-PT',
    
    // Timezone
    TIMEZONE: 'Europe/Lisbon',
    
    // Page sizes
    DEFAULT_PAGE_SIZE: 50,
    
    // Cache TTL (ms)
    CACHE_TTL: 5 * 60 * 1000 // 5 minutos
  },
  
  // ==========================================
  // DEBUG
  // ==========================================
  DEBUG: {
    ENABLED: true,
    LOG_API_CALLS: true,
    LOG_ERRORS: true
  }
};

// Freeze config para evitar modificações acidentais
Object.freeze(CONFIG);
Object.freeze(CONFIG.SUPABASE);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.DEBUG);
