// ===================================================================
// THEME SERVICE - Gestão de Tema/Branding da Plataforma
// ===================================================================

const ThemeService = (function() {
  
  // Configuração Supabase (duplicada para independência do DataService)
  const SUPABASE_URL = 'https://yujhfscnnngaivwwunom.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhmc2Nubm5nYWl2d3d1bm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODA5OTEsImV4cCI6MjA4MDk1Njk5MX0.wpWiNx6ck_gEujMoodbFTswjBjMbuEHeAO8lMtLes2c';
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  const CACHE_KEY = 'platform_theme_config';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  let themeConfig = null;
  let isInitialized = false;
  
  // Mapeamento de chaves BD para variáveis CSS
  const CSS_VAR_MAP = {
    'primary_color': '--primary-color',
    'primary_hover': '--primary-hover',
    'primary_light': '--primary-light',
    'secondary_color': '--secondary-color',
    'text_primary': '--text-primary',
    'text_secondary': '--text-secondary',
    'text_muted': '--text-muted',
    'border_color': '--border-color',
    'bg_gray': '--bg-gray',
    'bg_card': '--bg-card',
    'success_color': '--success',
    'warning_color': '--warning',
    'danger_color': '--danger',
    'info_color': '--info',
    'header_bg': '--header-bg',
    'header_border': '--header-border',
    'sidebar_bg': '--sidebar-bg',
    'modal_header_bg': '--modal-header-bg',
    'modal_header_text': '--modal-header-text',
    'quick_action_icon_bg': '--quick-action-icon-bg',
    'quick_action_icon_color': '--quick-action-icon-color',
    'btn_primary_bg': '--btn-primary-bg',
    'btn_primary_text': '--btn-primary-text',
    'gradient_start': '--gradient-start',
    'gradient_end': '--gradient-end',
    'logo_height': '--logo-height'
  };
  
  // Carregar configurações da BD
  async function loadConfig(forceRefresh = false) {
    try {
      // Verificar cache (a menos que forçar refresh)
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            themeConfig = data;
            console.log('[ThemeService] Config carregada do cache');
            return data;
          }
        }
      }
      
      // Carregar da BD
      const url = `${SUPABASE_URL}/rest/v1/configuracoes_tema?select=*`;
      console.log('[ThemeService] A carregar config da BD...');
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ThemeService] Erro response:', response.status, errorText);
        throw new Error('Erro ao carregar configurações de tema');
      }
      
      const configs = await response.json();
      console.log('[ThemeService] Configs carregadas:', configs.length);
      
      // Converter array para objeto
      themeConfig = {};
      configs.forEach(c => {
        themeConfig[c.chave] = {
          valor: c.valor,
          tipo: c.tipo,
          categoria: c.categoria,
          descricao: c.descricao
        };
      });
      
      // Guardar em cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: themeConfig,
        timestamp: Date.now()
      }));
      
      return themeConfig;
      
    } catch (error) {
      console.warn('[ThemeService] Erro ao carregar config:', error);
      return null;
    }
  }
  
  // Aplicar tema às variáveis CSS
  function applyTheme(config = null) {
    const cfg = config || themeConfig;
    if (!cfg) {
      console.warn('[ThemeService] Sem config para aplicar');
      return;
    }
    
    const root = document.documentElement;
    
    Object.keys(CSS_VAR_MAP).forEach(key => {
      if (cfg[key] && cfg[key].valor) {
        let value = cfg[key].valor;
        
        // Para altura do logo, adicionar 'px'
        if (key === 'logo_height' && !value.includes('px')) {
          value = value + 'px';
        }
        
        root.style.setProperty(CSS_VAR_MAP[key], value);
      }
    });
    
    // Atualizar gradiente
    if (cfg.gradient_start?.valor && cfg.gradient_end?.valor) {
      root.style.setProperty('--gradient-primary', 
        `linear-gradient(135deg, ${cfg.gradient_start.valor} 0%, ${cfg.gradient_end.valor} 100%)`);
      
      // Atualizar shadow primário
      root.style.setProperty('--shadow-primary', 
        `0 4px 15px ${hexToRgba(cfg.gradient_start.valor, 0.3)}`);
    }
    
    // Aplicar logo
    applyLogo(cfg);
    
    console.log('[ThemeService] Tema aplicado com sucesso');
  }
  
  // Aplicar logo no header
  function applyLogo(config = null) {
    const cfg = config || themeConfig;
    if (!cfg) return;
    
    const logoUrl = cfg.logo_url?.valor;
    const logoHeight = cfg.logo_height?.valor || '40';
    
    if (!logoUrl || logoUrl.trim() === '') {
      console.log('[ThemeService] Sem logo URL configurado');
      return;
    }
    
    // Procurar container do logo no header
    const logoContainers = document.querySelectorAll('.header-logo, #headerLogo, [data-theme-logo]');
    
    logoContainers.forEach(container => {
      // Verificar se já tem imagem do tema
      const existingImg = container.querySelector('img[data-theme-logo-img]');
      if (existingImg) {
        existingImg.src = logoUrl;
        existingImg.style.height = logoHeight + 'px';
      } else {
        // Esconder elementos padrão e adicionar imagem
        const defaultIcon = container.querySelector('.default-logo-icon');
        const defaultText = container.querySelector('.default-logo-text');
        
        if (defaultIcon) defaultIcon.style.display = 'none';
        if (defaultText) defaultText.style.display = 'none';
        
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = 'Logo';
        img.style.height = logoHeight + 'px';
        img.style.width = 'auto';
        img.setAttribute('data-theme-logo-img', 'true');
        img.onerror = function() {
          console.warn('[ThemeService] Erro ao carregar logo:', logoUrl);
          this.style.display = 'none';
          if (defaultIcon) defaultIcon.style.display = '';
          if (defaultText) defaultText.style.display = '';
        };
        
        container.insertBefore(img, container.firstChild);
      }
    });
    
    console.log('[ThemeService] Logo aplicado');
  }
  
  // Guardar uma configuração
  async function saveConfig(chave, valor) {
    try {
      console.log('[ThemeService] A guardar:', chave, '=', valor);
      
      const url = `${SUPABASE_URL}/rest/v1/configuracoes_tema?chave=eq.${chave}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          valor: valor,
          updated_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ThemeService] Erro ao guardar:', response.status, errorText);
        throw new Error('Erro ao guardar configuração: ' + errorText);
      }
      
      // Atualizar cache local
      if (themeConfig && themeConfig[chave]) {
        themeConfig[chave].valor = valor;
      }
      
      console.log('[ThemeService] Guardado com sucesso:', chave);
      return true;
      
    } catch (error) {
      console.error('[ThemeService] Erro ao guardar:', error);
      throw error;
    }
  }
  
  // Guardar múltiplas configurações
  async function saveMultipleConfigs(configs) {
    try {
      console.log('[ThemeService] A guardar múltiplas configs:', Object.keys(configs).length);
      
      const promises = Object.keys(configs).map(chave => 
        saveConfig(chave, configs[chave])
      );
      
      await Promise.all(promises);
      
      // Limpar cache para forçar reload
      localStorage.removeItem(CACHE_KEY);
      
      // Recarregar e aplicar
      await loadConfig(true);
      applyTheme();
      
      console.log('[ThemeService] Todas as configs guardadas com sucesso');
      return true;
      
    } catch (error) {
      console.error('[ThemeService] Erro ao guardar múltiplas configs:', error);
      throw error;
    }
  }
  
  // Obter valor de uma configuração
  function getConfig(chave) {
    if (!themeConfig || !themeConfig[chave]) return null;
    return themeConfig[chave].valor;
  }
  
  // Obter todas as configurações
  function getAllConfigs() {
    return themeConfig;
  }
  
  // Obter configurações por categoria
  function getConfigsByCategory(categoria) {
    if (!themeConfig) return {};
    
    const filtered = {};
    Object.keys(themeConfig).forEach(key => {
      if (themeConfig[key].categoria === categoria) {
        filtered[key] = themeConfig[key];
      }
    });
    return filtered;
  }
  
  // Reset para valores padrão
  async function resetToDefaults() {
    const defaults = {
      'primary_color': '#00b276',
      'primary_hover': '#009661',
      'primary_light': '#e6f7f1',
      'secondary_color': '#282a32',
      'text_primary': '#282a32',
      'text_secondary': '#686b87',
      'text_muted': '#94a3b8',
      'border_color': '#e9ecf4',
      'bg_gray': '#f8fafb',
      'bg_card': '#ffffff',
      'success_color': '#00b276',
      'warning_color': '#f59e0b',
      'danger_color': '#ef4444',
      'info_color': '#3b82f6',
      'header_bg': '#ffffff',
      'header_border': '#e9ecf4',
      'modal_header_bg': '#00b276',
      'modal_header_text': '#ffffff',
      'quick_action_icon_bg': '#00b276',
      'quick_action_icon_color': '#ffffff',
      'btn_primary_bg': '#00b276',
      'btn_primary_text': '#ffffff',
      'gradient_start': '#00b276',
      'gradient_end': '#059669',
      'logo_height': '40',
      'logo_url': ''
    };
    
    await saveMultipleConfigs(defaults);
    return defaults;
  }
  
  // Limpar cache
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    themeConfig = null;
    isInitialized = false;
    console.log('[ThemeService] Cache limpo');
  }
  
  // Utilitário: hex para rgba
  function hexToRgba(hex, alpha = 1) {
    if (!hex || hex.length < 7) return `rgba(0, 178, 118, ${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  // Inicialização
  async function init() {
    if (isInitialized) {
      console.log('[ThemeService] Já inicializado');
      return;
    }
    
    console.log('[ThemeService] A inicializar...');
    
    try {
      await loadConfig();
      applyTheme();
      isInitialized = true;
      console.log('[ThemeService] Inicializado com sucesso');
    } catch (error) {
      console.error('[ThemeService] Erro na inicialização:', error);
    }
  }
  
  // Auto-inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM já está pronto, inicializar com pequeno delay para garantir que outros scripts carregaram
    setTimeout(init, 100);
  }
  
  // API Pública
  return {
    loadConfig,
    applyTheme,
    applyLogo,
    saveConfig,
    saveMultipleConfigs,
    getConfig,
    getAllConfigs,
    getConfigsByCategory,
    resetToDefaults,
    clearCache,
    init
  };
  
})();

window.ThemeService = ThemeService;
