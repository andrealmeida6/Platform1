// ===================================================================
// AUTH SERVICE - Gestão de Autenticação e Permissões
// ===================================================================
// Serviço para gestão do utilizador atual, roles e funcionalidade
// "Ver como" para simular diferentes utilizadores/permissões
// ===================================================================

const AuthService = (function() {
  
  // Chave para localStorage
  const STORAGE_KEY = 'platform1_current_user';
  const VIEW_AS_KEY = 'platform1_view_as';
  
  // Cache de dados
  let currentUserCache = null;
  let viewAsUserCache = null;
  let rolesCache = null;
  let colaboradoresCache = null;
  
  // ==========================================
  // FUNÇÕES DE ROLES
  // ==========================================
  
  /**
   * Obtém todas as roles disponíveis
   */
  async function getRoles() {
    if (rolesCache) return rolesCache;
    
    rolesCache = await DataService.retrieveMultipleRecords('roles', {
      filter: { ativo: true },
      orderby: 'nivel.desc'
    });
    return rolesCache;
  }
  
  /**
   * Obtém colaboradores com as suas roles
   */
  async function getColaboradoresComRoles() {
    const select = '*,departamentos(id,codigo,nome),colaborador_roles(id,role_id,ativo,roles(id,codigo,nome,nivel,scope,permissoes))';
    const colaboradores = await DataService.retrieveWithRelations('colaboradores', select, { ativo: true });
    
    // Processar para facilitar uso
    return colaboradores.map(c => ({
      ...c,
      roles: (c.colaborador_roles || [])
        .filter(cr => cr.ativo)
        .map(cr => cr.roles)
        .sort((a, b) => b.nivel - a.nivel)
    }));
  }
  
  /**
   * Obtém um colaborador específico com roles
   */
  async function getColaboradorComRoles(colaboradorId) {
    const select = '*,departamentos(id,codigo,nome),colaborador_roles(id,role_id,ativo,roles(id,codigo,nome,nivel,scope,permissoes))';
    const result = await DataService.retrieveWithRelations('colaboradores', select, { id: colaboradorId });
    
    if (result.length === 0) return null;
    
    const c = result[0];
    return {
      ...c,
      roles: (c.colaborador_roles || [])
        .filter(cr => cr.ativo)
        .map(cr => cr.roles)
        .sort((a, b) => b.nivel - a.nivel)
    };
  }
  
  /**
   * Atribui uma role a um colaborador
   */
  async function atribuirRole(colaboradorId, roleId, atribuidoPor = null) {
    return DataService.createRecord('colaborador_roles', {
      colaborador_id: colaboradorId,
      role_id: roleId,
      atribuido_por: atribuidoPor,
      ativo: true
    });
  }
  
  /**
   * Remove uma role de um colaborador
   */
  async function removerRole(colaboradorId, roleId) {
    // Buscar o registo
    const registos = await DataService.retrieveMultipleRecords('colaborador_roles', {
      filter: {
        colaborador_id: colaboradorId,
        role_id: roleId
      }
    });
    
    if (registos.length > 0) {
      return DataService.deleteRecord('colaborador_roles', registos[0].id);
    }
    return false;
  }
  
  // ==========================================
  // GESTÃO DO UTILIZADOR ATUAL
  // ==========================================
  
  /**
   * Define o utilizador atual (simulação de login)
   */
  async function setCurrentUser(colaboradorId) {
    localStorage.setItem(STORAGE_KEY, colaboradorId);
    currentUserCache = await getColaboradorComRoles(colaboradorId);
    return currentUserCache;
  }
  
  /**
   * Obtém o utilizador atual
   */
  async function getCurrentUser() {
    // Se há "Ver como" ativo, retorna esse utilizador
    const viewAsId = localStorage.getItem(VIEW_AS_KEY);
    if (viewAsId) {
      if (!viewAsUserCache || viewAsUserCache.id !== viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
      }
      return viewAsUserCache;
    }
    
    // Retorna o utilizador real
    if (currentUserCache) return currentUserCache;
    
    const userId = localStorage.getItem(STORAGE_KEY);
    if (userId) {
      currentUserCache = await getColaboradorComRoles(userId);
      return currentUserCache;
    }
    
    // Default: primeiro utilizador com role Núcleo, ou primeiro colaborador
    const colaboradores = await getColaboradoresComRoles();
    const admin = colaboradores.find(c => c.roles.some(r => r.codigo === 'nucleo'));
    const defaultUser = admin || colaboradores[0];
    
    if (defaultUser) {
      await setCurrentUser(defaultUser.id);
      return currentUserCache;
    }
    
    return null;
  }
  
  /**
   * Obtém o utilizador real (ignorando "Ver como")
   */
  async function getRealUser() {
    const userId = localStorage.getItem(STORAGE_KEY);
    if (!userId) return getCurrentUser();
    
    if (!currentUserCache || currentUserCache.id !== userId) {
      currentUserCache = await getColaboradorComRoles(userId);
    }
    return currentUserCache;
  }
  
  // ==========================================
  // FUNCIONALIDADE "VER COMO"
  // ==========================================
  
  /**
   * Ativa modo "Ver como" outro utilizador
   */
  async function setViewAs(colaboradorId) {
    if (colaboradorId) {
      localStorage.setItem(VIEW_AS_KEY, colaboradorId);
      viewAsUserCache = await getColaboradorComRoles(colaboradorId);
    } else {
      localStorage.removeItem(VIEW_AS_KEY);
      viewAsUserCache = null;
    }
    
    // Dispara evento para atualizar UI
    window.dispatchEvent(new CustomEvent('viewAsChanged', { 
      detail: { viewAsUser: viewAsUserCache }
    }));
    
    return viewAsUserCache;
  }
  
  /**
   * Obtém utilizador do modo "Ver como" (se ativo)
   */
  function getViewAsUser() {
    return viewAsUserCache;
  }
  
  /**
   * Verifica se modo "Ver como" está ativo
   */
  function isViewAsActive() {
    return localStorage.getItem(VIEW_AS_KEY) !== null;
  }
  
  /**
   * Desativa modo "Ver como"
   */
  function clearViewAs() {
    localStorage.removeItem(VIEW_AS_KEY);
    viewAsUserCache = null;
    
    window.dispatchEvent(new CustomEvent('viewAsChanged', { 
      detail: { viewAsUser: null }
    }));
  }
  
  // ==========================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ==========================================
  
  /**
   * Verifica se utilizador tem uma role específica
   */
  function hasRole(user, roleCode) {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.codigo === roleCode);
  }
  
  /**
   * Verifica se utilizador tem uma permissão específica
   */
  function hasPermission(user, permission) {
    if (!user || !user.roles) return false;
    
    return user.roles.some(r => {
      const perms = r.permissoes || {};
      return perms[permission] === true || perms.ver_tudo === true;
    });
  }
  
  /**
   * Obtém o nível máximo de permissão do utilizador
   */
  function getMaxLevel(user) {
    if (!user || !user.roles || user.roles.length === 0) return 0;
    return Math.max(...user.roles.map(r => r.nivel || 0));
  }
  
  /**
   * Verifica se utilizador é admin (Núcleo)
   */
  function isAdmin(user) {
    return hasRole(user, 'nucleo');
  }
  
  /**
   * Verifica se utilizador pode ver backoffice
   */
  function canAccessBackoffice(user) {
    return hasPermission(user, 'backoffice') || hasPermission(user, 'gerir_utilizadores');
  }
  
  /**
   * Verifica se utilizador pode aprovar pedidos
   */
  function canApprove(user) {
    return hasPermission(user, 'aprovar') || hasPermission(user, 'aprovar_afr');
  }
  
  /**
   * Filtra dados baseado nas permissões do utilizador
   * @param {Array} data - Array de dados a filtrar
   * @param {Object} user - Utilizador atual
   * @param {string} ownerField - Campo que identifica o proprietário (ex: 'criado_por', 'colaborador_id')
   */
  function filterByPermissions(data, user, ownerField = 'criado_por') {
    if (!user || !data) return [];
    
    // Admin vê tudo
    if (isAdmin(user)) return data;
    
    // AFR Dirigente vê tudo da AFR (para este exemplo, vê tudo também)
    if (hasRole(user, 'afr_dirigente')) return data;
    
    // Basic User vê apenas o próprio
    return data.filter(item => {
      // Verifica se é o criador
      if (item[ownerField] === user.id) return true;
      
      // Verifica se está nos colaboradores associados
      if (item.deslocacao_colaboradores) {
        return item.deslocacao_colaboradores.some(dc => dc.colaborador_id === user.id);
      }
      if (item.formacao_inscricoes) {
        return item.formacao_inscricoes.some(fi => fi.colaborador_id === user.id);
      }
      
      return false;
    });
  }
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  /**
   * Inicializa o serviço de autenticação
   */
  async function init() {
    // Carregar utilizador atual
    await getCurrentUser();
    
    // Verificar se há "Ver como" ativo
    const viewAsId = localStorage.getItem(VIEW_AS_KEY);
    if (viewAsId) {
      viewAsUserCache = await getColaboradorComRoles(viewAsId);
    }
    
    console.log('[AuthService] Inicializado');
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    // Roles
    getRoles,
    getColaboradoresComRoles,
    getColaboradorComRoles,
    atribuirRole,
    removerRole,
    
    // Utilizador atual
    setCurrentUser,
    getCurrentUser,
    getRealUser,
    
    // Ver como
    setViewAs,
    getViewAsUser,
    isViewAsActive,
    clearViewAs,
    
    // Permissões
    hasRole,
    hasPermission,
    getMaxLevel,
    isAdmin,
    canAccessBackoffice,
    canApprove,
    filterByPermissions,
    
    // Inicialização
    init
  };
  
})();

// Exportar para uso global
window.AuthService = AuthService;
