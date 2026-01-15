// ===================================================================
// AUTH SERVICE - Gestão de Autenticação e Permissões (v4)
// ===================================================================
// Utilizador padrão: André Borges
// Funcionalidade "Ver como" para administradores
// ===================================================================

const AuthService = (function() {
  
  const VIEW_AS_KEY = 'platform1_view_as';
  
  // Nome do utilizador padrão - André Borges (SEMPRE o utilizador base)
  const DEFAULT_USER_NAME = 'André Borges';
  
  let realUserCache = null;      // Cache do utilizador real (André Borges)
  let viewAsUserCache = null;    // Cache do utilizador "Ver como"
  let rolesCache = null;
  let initialized = false;
  
  // ==========================================
  // FUNÇÕES DE ROLES
  // ==========================================
  
  async function getRoles() {
    if (rolesCache) return rolesCache;
    
    try {
      const url = `${DataService.getBaseUrl()}/rest/v1/roles?ativo=eq.true&order=nivel.desc`;
      const response = await fetch(url, { headers: DataService.getHeaders() });
      if (!response.ok) throw new Error('Erro ao buscar roles');
      rolesCache = await response.json();
      return rolesCache;
    } catch (error) {
      console.error('[AuthService] Erro ao buscar roles:', error);
      return [];
    }
  }
  
  async function getColaboradoresComRoles() {
    try {
      // Buscar colaboradores
      const urlColab = `${DataService.getBaseUrl()}/rest/v1/colaboradores?ativo=eq.true&select=*,departamentos(id,codigo,nome)&order=nome.asc`;
      const respColab = await fetch(urlColab, { headers: DataService.getHeaders() });
      if (!respColab.ok) throw new Error('Erro ao buscar colaboradores');
      const colaboradores = await respColab.json();
      
      // Buscar colaborador_roles
      const urlCR = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?ativo=eq.true&select=colaborador_id,role_id`;
      const respCR = await fetch(urlCR, { headers: DataService.getHeaders() });
      if (!respCR.ok) throw new Error('Erro ao buscar colaborador_roles');
      const colaboradorRoles = await respCR.json();
      
      // Buscar roles
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      // Criar mapa de roles por colaborador
      const rolesByColaborador = {};
      colaboradorRoles.forEach(cr => {
        if (!rolesByColaborador[cr.colaborador_id]) {
          rolesByColaborador[cr.colaborador_id] = [];
        }
        if (rolesMap[cr.role_id]) {
          rolesByColaborador[cr.colaborador_id].push(rolesMap[cr.role_id]);
        }
      });
      
      // Combinar dados
      return colaboradores.map(c => ({
        ...c,
        roles: (rolesByColaborador[c.id] || []).sort((a, b) => (b.nivel || 0) - (a.nivel || 0))
      }));
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaboradores com roles:', error);
      return [];
    }
  }
  
  async function getColaboradorComRoles(colaboradorId) {
    try {
      // Buscar colaborador
      const urlColab = `${DataService.getBaseUrl()}/rest/v1/colaboradores?id=eq.${colaboradorId}&select=*,departamentos(id,codigo,nome)`;
      const respColab = await fetch(urlColab, { headers: DataService.getHeaders() });
      if (!respColab.ok) throw new Error('Erro ao buscar colaborador');
      const colaboradores = await respColab.json();
      if (colaboradores.length === 0) return null;
      
      // Buscar roles do colaborador
      const urlCR = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?colaborador_id=eq.${colaboradorId}&ativo=eq.true&select=role_id`;
      const respCR = await fetch(urlCR, { headers: DataService.getHeaders() });
      if (!respCR.ok) throw new Error('Erro ao buscar roles do colaborador');
      const colaboradorRoles = await respCR.json();
      
      // Buscar roles
      const roles = await getRoles();
      const rolesMap = {};
      roles.forEach(r => rolesMap[r.id] = r);
      
      // Combinar
      const userRoles = colaboradorRoles
        .map(cr => rolesMap[cr.role_id])
        .filter(r => r)
        .sort((a, b) => (b.nivel || 0) - (a.nivel || 0));
      
      return {
        ...colaboradores[0],
        roles: userRoles
      };
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaborador:', error);
      return null;
    }
  }
  
  async function getColaboradorByNome(nome) {
    try {
      // Usar ilike para busca case-insensitive
      const urlColab = `${DataService.getBaseUrl()}/rest/v1/colaboradores?nome=ilike.${encodeURIComponent(nome)}&ativo=eq.true&select=*,departamentos(id,codigo,nome)&limit=1`;
      const respColab = await fetch(urlColab, { headers: DataService.getHeaders() });
      if (!respColab.ok) throw new Error('Erro ao buscar colaborador por nome');
      const colaboradores = await respColab.json();
      if (colaboradores.length === 0) return null;
      
      // Buscar roles do colaborador encontrado
      return await getColaboradorComRoles(colaboradores[0].id);
    } catch (error) {
      console.error('[AuthService] Erro ao buscar colaborador por nome:', error);
      return null;
    }
  }
  
  async function atribuirRole(colaboradorId, roleId) {
    try {
      const url = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles`;
      const response = await fetch(url, {
        method: 'POST',
        headers: DataService.getHeaders(),
        body: JSON.stringify({
          colaborador_id: colaboradorId,
          role_id: roleId,
          ativo: true
        })
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return await response.json();
    } catch (error) {
      console.error('[AuthService] Erro ao atribuir role:', error);
      throw error;
    }
  }
  
  async function removerRole(colaboradorId, roleId) {
    try {
      const urlGet = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?colaborador_id=eq.${colaboradorId}&role_id=eq.${roleId}`;
      const respGet = await fetch(urlGet, { headers: DataService.getHeaders() });
      const registos = await respGet.json();
      
      if (registos.length > 0) {
        const urlDelete = `${DataService.getBaseUrl()}/rest/v1/colaborador_roles?id=eq.${registos[0].id}`;
        const respDelete = await fetch(urlDelete, {
          method: 'DELETE',
          headers: DataService.getHeaders()
        });
        return respDelete.ok;
      }
      return false;
    } catch (error) {
      console.error('[AuthService] Erro ao remover role:', error);
      throw error;
    }
  }
  
  // ==========================================
  // GESTÃO DO UTILIZADOR
  // ==========================================
  
  /**
   * Obter o utilizador real (SEMPRE André Borges)
   */
  async function getRealUser() {
    if (realUserCache) return realUserCache;
    
    try {
      console.log('[AuthService] A buscar utilizador real: ' + DEFAULT_USER_NAME);
      realUserCache = await getColaboradorByNome(DEFAULT_USER_NAME);
      
      if (realUserCache) {
        console.log('[AuthService] Utilizador real definido: ' + realUserCache.nome);
        return realUserCache;
      }
      
      // Fallback: primeiro utilizador com role Núcleo
      console.log('[AuthService] ' + DEFAULT_USER_NAME + ' não encontrado, a buscar admin...');
      const colaboradores = await getColaboradoresComRoles();
      if (colaboradores.length === 0) return null;
      
      const admin = colaboradores.find(c => c.roles && c.roles.some(r => r.codigo === 'nucleo'));
      realUserCache = admin || colaboradores[0];
      
      if (realUserCache) {
        console.log('[AuthService] Utilizador fallback definido: ' + realUserCache.nome);
      }
      
      return realUserCache;
    } catch (error) {
      console.error('[AuthService] Erro ao obter utilizador real:', error);
      return null;
    }
  }
  
  /**
   * Obter o utilizador atual (pode ser "Ver como" ou o real)
   */
  async function getCurrentUser() {
    // Se há "Ver como" ativo, retorna esse utilizador
    const viewAsId = localStorage.getItem(VIEW_AS_KEY);
    if (viewAsId) {
      if (!viewAsUserCache || viewAsUserCache.id !== viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
      }
      if (viewAsUserCache) {
        return viewAsUserCache;
      }
      // Se não encontrou o utilizador do view-as, limpar e usar o real
      localStorage.removeItem(VIEW_AS_KEY);
    }
    
    // Retorna o utilizador real (André Borges)
    return await getRealUser();
  }
  
  /**
   * Definir manualmente o utilizador atual (apenas para testes)
   */
  async function setCurrentUser(colaboradorId) {
    realUserCache = await getColaboradorComRoles(colaboradorId);
    return realUserCache;
  }
  
  // ==========================================
  // FUNCIONALIDADE "VER COMO"
  // ==========================================
  
  async function setViewAs(colaboradorId) {
    if (colaboradorId) {
      localStorage.setItem(VIEW_AS_KEY, colaboradorId);
      viewAsUserCache = await getColaboradorComRoles(colaboradorId);
      console.log('[AuthService] Ver como definido: ' + (viewAsUserCache?.nome || 'desconhecido'));
    } else {
      clearViewAs();
    }
    return viewAsUserCache;
  }
  
  function getViewAsUser() {
    return viewAsUserCache;
  }
  
  function isViewAsActive() {
    return localStorage.getItem(VIEW_AS_KEY) !== null;
  }
  
  function clearViewAs() {
    localStorage.removeItem(VIEW_AS_KEY);
    viewAsUserCache = null;
    console.log('[AuthService] Ver como limpo, voltando a: ' + (realUserCache?.nome || DEFAULT_USER_NAME));
  }
  
  // ==========================================
  // NOTIFICAÇÃO DE MUDANÇA DE UTILIZADOR
  // ==========================================
  
  function notifyUserChange(user) {
    console.log('[AuthService] A notificar mudança de utilizador:', user?.nome);
    
    // Disparar evento customizado para componentes que precisam atualizar
    const event = new CustomEvent('userChanged', { 
      detail: { user: user },
      bubbles: true 
    });
    document.dispatchEvent(event);
  }
  
  // ==========================================
  // VERIFICAÇÃO DE PERMISSÕES
  // ==========================================
  
  function hasRole(user, roleCode) {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.codigo === roleCode);
  }
  
  function isAdmin(user) {
    return hasRole(user, 'nucleo');
  }
  
  function canAccessBackoffice(user) {
    return isAdmin(user);
  }
  
  function isAFRRH(user) {
    return hasRole(user, 'afr_rh');
  }
  
  function canAccessFormacaoManagement(user) {
    return isAdmin(user) || isAFRRH(user);
  }
  
  function isSecretariado(user) {
    return hasRole(user, 'secretariado');
  }
  
  function isDirigente(user) {
    return hasRole(user, 'afr_dirigente');
  }
  
  function canApproveFormacaoLevel1(user, pedido) {
    if (!isDirigente(user)) return false;
    if (!pedido || !pedido.solicitante) return false;
    return user.departamento_id === pedido.solicitante.departamento_id;
  }
  
  function canApproveFormacaoLevel2(user) {
    return canAccessFormacaoManagement(user);
  }
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  async function init() {
    if (initialized) {
      console.log('[AuthService] Já inicializado');
      return true;
    }
    
    try {
      console.log('[AuthService] A inicializar...');
      
      // Carregar o utilizador real (André Borges)
      await getRealUser();
      
      // Carregar o view-as se existir
      const viewAsId = localStorage.getItem(VIEW_AS_KEY);
      if (viewAsId) {
        viewAsUserCache = await getColaboradorComRoles(viewAsId);
        if (!viewAsUserCache) {
          // Se não encontrou, limpar
          localStorage.removeItem(VIEW_AS_KEY);
        }
      }
      
      initialized = true;
      console.log('[AuthService] Inicializado. Utilizador real:', realUserCache?.nome, 
                  '| Ver como:', viewAsUserCache?.nome || 'não ativo');
      return true;
    } catch (error) {
      console.error('[AuthService] Erro na inicialização:', error);
      return false;
    }
  }
  
  /**
   * Resetar para o estado inicial (limpa view-as e caches)
   */
  function reset() {
    localStorage.removeItem(VIEW_AS_KEY);
    realUserCache = null;
    viewAsUserCache = null;
    rolesCache = null;
    initialized = false;
    console.log('[AuthService] Reset completo');
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    getRoles,
    getColaboradoresComRoles,
    getColaboradorComRoles,
    getColaboradorByNome,
    atribuirRole,
    removerRole,
    setCurrentUser,
    getCurrentUser,
    getRealUser,
    setViewAs,
    getViewAsUser,
    isViewAsActive,
    clearViewAs,
    notifyUserChange,
    hasRole,
    isAdmin,
    canAccessBackoffice,
    isAFRRH,
    canAccessFormacaoManagement,
    isSecretariado,
    isDirigente,
    canApproveFormacaoLevel1,
    canApproveFormacaoLevel2,
    init,
    reset,
    DEFAULT_USER_NAME
  };
  
})();

window.AuthService = AuthService;
