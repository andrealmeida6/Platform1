// =============================================
// DATA SERVICE - CAMADA DE ABSTRAÇÃO DE DADOS
// Compatibilidade: Supabase / Power Pages
// =============================================

/**
 * DataService - Serviço unificado de acesso a dados
 * 
 * Este serviço abstrai a fonte de dados (Supabase ou Power Pages/Dataverse)
 * permitindo que o mesmo código funcione em ambos os ambientes.
 * 
 * PADRÃO DE USO (similar ao Power Pages Web API):
 * 
 * // Buscar todos os registos
 * const dados = await DataService.getAll('tabela');
 * 
 * // Buscar com filtros
 * const dados = await DataService.getAll('tabela', {
 *   filter: { estado: 'Ativo', tipo: 'Interno' },
 *   orderBy: 'nome',
 *   orderDirection: 'asc',
 *   top: 10
 * });
 * 
 * // Buscar um registo por ID
 * const registo = await DataService.getById('tabela', 'uuid');
 * 
 * // Criar registo
 * const novo = await DataService.create('tabela', { campo1: 'valor' });
 * 
 * // Atualizar registo
 * await DataService.update('tabela', 'uuid', { campo1: 'novo valor' });
 * 
 * // Eliminar registo
 * await DataService.delete('tabela', 'uuid');
 */

const DataService = (function() {
  'use strict';
  
  // ==========================================
  // CACHE LOCAL
  // ==========================================
  const cache = new Map();
  
  function getCacheKey(table, options) {
    return `${table}:${JSON.stringify(options || {})}`;
  }
  
  function getFromCache(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CONFIG.APP.CACHE_TTL) {
      if (CONFIG.DEBUG.LOG_API_CALLS) console.log('[DataService] Cache hit:', key);
      return cached.data;
    }
    return null;
  }
  
  function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
  }
  
  function clearCache(table) {
    if (table) {
      // Limpar cache específico da tabela
      for (const key of cache.keys()) {
        if (key.startsWith(table + ':')) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }
  
  // ==========================================
  // SUPABASE ADAPTER
  // ==========================================
  const SupabaseAdapter = {
    /**
     * Constrói os headers para a API do Supabase
     */
    getHeaders() {
      return {
        'apikey': CONFIG.SUPABASE.ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE.ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    },
    
    /**
     * Constrói a URL com query params para filtros
     */
    buildUrl(table, options = {}) {
      let url = `${CONFIG.SUPABASE.URL}/rest/v1/${table}`;
      const params = new URLSearchParams();
      
      // Select (colunas e relações)
      if (options.select) {
        params.append('select', options.select);
      } else {
        params.append('select', '*');
      }
      
      // Filtros (formato: coluna=eq.valor)
      if (options.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          if (value !== null && value !== undefined && value !== '') {
            // Suporta operadores: eq, neq, gt, gte, lt, lte, like, ilike, in
            if (typeof value === 'object' && value.operator) {
              params.append(key, `${value.operator}.${value.value}`);
            } else {
              params.append(key, `eq.${value}`);
            }
          }
        }
      }
      
      // Ordenação
      if (options.orderBy) {
        const direction = options.orderDirection === 'desc' ? '.desc' : '.asc';
        params.append('order', `${options.orderBy}${direction}`);
      }
      
      // Limitar resultados
      if (options.top) {
        params.append('limit', options.top.toString());
      }
      
      // Paginação
      if (options.skip) {
        params.append('offset', options.skip.toString());
      }
      
      const queryString = params.toString();
      return queryString ? `${url}?${queryString}` : url;
    },
    
    /**
     * GET - Buscar registos
     */
    async getAll(table, options = {}) {
      const url = this.buildUrl(table, options);
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] GET:', url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error fetching ${table}`);
      }
      
      return response.json();
    },
    
    /**
     * GET by ID - Buscar um registo
     */
    async getById(table, id) {
      const url = `${CONFIG.SUPABASE.URL}/rest/v1/${table}?id=eq.${id}&select=*`;
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] GET by ID:', url);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error fetching ${table}/${id}`);
      }
      
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    },
    
    /**
     * POST - Criar registo
     */
    async create(table, data) {
      const url = `${CONFIG.SUPABASE.URL}/rest/v1/${table}`;
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] POST:', url, data);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error creating ${table}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    },
    
    /**
     * PATCH - Atualizar registo
     */
    async update(table, id, data) {
      const url = `${CONFIG.SUPABASE.URL}/rest/v1/${table}?id=eq.${id}`;
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] PATCH:', url, data);
      }
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error updating ${table}/${id}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    },
    
    /**
     * DELETE - Eliminar registo
     */
    async delete(table, id) {
      const url = `${CONFIG.SUPABASE.URL}/rest/v1/${table}?id=eq.${id}`;
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] DELETE:', url);
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error deleting ${table}/${id}`);
      }
      
      return true;
    },
    
    /**
     * RPC - Chamar função PostgreSQL
     */
    async rpc(functionName, params = {}) {
      const url = `${CONFIG.SUPABASE.URL}/rest/v1/rpc/${functionName}`;
      
      if (CONFIG.DEBUG.LOG_API_CALLS) {
        console.log('[Supabase] RPC:', url, params);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error calling ${functionName}`);
      }
      
      return response.json();
    }
  };
  
  // ==========================================
  // POWER PAGES ADAPTER (para migração futura)
  // ==========================================
  const PowerPagesAdapter = {
    /**
     * Mapeia nome da tabela Supabase para Dataverse
     */
    mapTable(table) {
      if (CONFIG.POWERPAGES && CONFIG.POWERPAGES.TABLE_MAP) {
        return CONFIG.POWERPAGES.TABLE_MAP[table] || table;
      }
      return table;
    },
    
    /**
     * GET - Buscar registos via Web API do Dataverse
     */
    async getAll(table, options = {}) {
      const entitySet = this.mapTable(table);
      let url = `${CONFIG.POWERPAGES.API_URL}/${entitySet}`;
      const params = new URLSearchParams();
      
      // $select
      if (options.select) {
        params.append('$select', options.select.replace(/,/g, ','));
      }
      
      // $filter
      if (options.filter) {
        const filters = [];
        for (const [key, value] of Object.entries(options.filter)) {
          if (value !== null && value !== undefined && value !== '') {
            filters.push(`${key} eq '${value}'`);
          }
        }
        if (filters.length > 0) {
          params.append('$filter', filters.join(' and '));
        }
      }
      
      // $orderby
      if (options.orderBy) {
        const direction = options.orderDirection === 'desc' ? ' desc' : ' asc';
        params.append('$orderby', `${options.orderBy}${direction}`);
      }
      
      // $top
      if (options.top) {
        params.append('$top', options.top.toString());
      }
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching ${table}`);
      }
      
      const result = await response.json();
      return result.value || result;
    },
    
    async getById(table, id) {
      const entitySet = this.mapTable(table);
      const url = `${CONFIG.POWERPAGES.API_URL}/${entitySet}(${id})`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error fetching ${table}/${id}`);
      }
      
      return response.json();
    },
    
    async create(table, data) {
      const entitySet = this.mapTable(table);
      const url = `${CONFIG.POWERPAGES.API_URL}/${entitySet}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating ${table}`);
      }
      
      return response.json();
    },
    
    async update(table, id, data) {
      const entitySet = this.mapTable(table);
      const url = `${CONFIG.POWERPAGES.API_URL}/${entitySet}(${id})`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating ${table}/${id}`);
      }
      
      return true;
    },
    
    async delete(table, id) {
      const entitySet = this.mapTable(table);
      const url = `${CONFIG.POWERPAGES.API_URL}/${entitySet}(${id})`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting ${table}/${id}`);
      }
      
      return true;
    }
  };
  
  // ==========================================
  // MOCK ADAPTER (para testes offline)
  // ==========================================
  const MockAdapter = {
    mockData: {},
    
    setMockData(table, data) {
      this.mockData[table] = data;
    },
    
    async getAll(table, options = {}) {
      let data = this.mockData[table] || [];
      
      // Aplicar filtros
      if (options.filter) {
        data = data.filter(item => {
          for (const [key, value] of Object.entries(options.filter)) {
            if (item[key] !== value) return false;
          }
          return true;
        });
      }
      
      // Ordenar
      if (options.orderBy) {
        const dir = options.orderDirection === 'desc' ? -1 : 1;
        data.sort((a, b) => {
          if (a[options.orderBy] < b[options.orderBy]) return -1 * dir;
          if (a[options.orderBy] > b[options.orderBy]) return 1 * dir;
          return 0;
        });
      }
      
      // Limitar
      if (options.top) {
        data = data.slice(0, options.top);
      }
      
      return Promise.resolve(data);
    },
    
    async getById(table, id) {
      const data = this.mockData[table] || [];
      return Promise.resolve(data.find(item => item.id === id) || null);
    },
    
    async create(table, data) {
      if (!this.mockData[table]) this.mockData[table] = [];
      const newItem = { ...data, id: crypto.randomUUID() };
      this.mockData[table].push(newItem);
      return Promise.resolve(newItem);
    },
    
    async update(table, id, data) {
      const items = this.mockData[table] || [];
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data };
        return Promise.resolve(items[index]);
      }
      throw new Error('Not found');
    },
    
    async delete(table, id) {
      const items = this.mockData[table] || [];
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items.splice(index, 1);
        return Promise.resolve(true);
      }
      throw new Error('Not found');
    }
  };
  
  // ==========================================
  // SELECIONAR ADAPTER BASEADO NA CONFIG
  // ==========================================
  function getAdapter() {
    switch (CONFIG.ENVIRONMENT) {
      case 'powerpages':
        return PowerPagesAdapter;
      case 'mock':
        return MockAdapter;
      case 'supabase':
      default:
        return SupabaseAdapter;
    }
  }
  
  // ==========================================
  // API PÚBLICA DO DATASERVICE
  // ==========================================
  return {
    /**
     * Buscar todos os registos de uma tabela
     * @param {string} table - Nome da tabela
     * @param {object} options - Opções de query
     * @param {string} options.select - Colunas a selecionar (ex: 'id,nome,email')
     * @param {object} options.filter - Filtros (ex: { estado: 'Ativo' })
     * @param {string} options.orderBy - Coluna para ordenar
     * @param {string} options.orderDirection - 'asc' ou 'desc'
     * @param {number} options.top - Limitar número de resultados
     * @param {number} options.skip - Saltar N registos (paginação)
     * @param {boolean} options.useCache - Usar cache (default: true)
     * @returns {Promise<Array>}
     */
    async getAll(table, options = {}) {
      try {
        // Verificar cache
        if (options.useCache !== false) {
          const cacheKey = getCacheKey(table, options);
          const cached = getFromCache(cacheKey);
          if (cached) return cached;
        }
        
        const adapter = getAdapter();
        const data = await adapter.getAll(table, options);
        
        // Guardar em cache
        if (options.useCache !== false) {
          const cacheKey = getCacheKey(table, options);
          setCache(cacheKey, data);
        }
        
        return data;
      } catch (error) {
        if (CONFIG.DEBUG.LOG_ERRORS) {
          console.error(`[DataService] Error in getAll(${table}):`, error);
        }
        throw error;
      }
    },
    
    /**
     * Buscar um registo por ID
     * @param {string} table - Nome da tabela
     * @param {string} id - ID do registo
     * @returns {Promise<object|null>}
     */
    async getById(table, id) {
      try {
        const adapter = getAdapter();
        return await adapter.getById(table, id);
      } catch (error) {
        if (CONFIG.DEBUG.LOG_ERRORS) {
          console.error(`[DataService] Error in getById(${table}, ${id}):`, error);
        }
        throw error;
      }
    },
    
    /**
     * Criar um novo registo
     * @param {string} table - Nome da tabela
     * @param {object} data - Dados a inserir
     * @returns {Promise<object>}
     */
    async create(table, data) {
      try {
        const adapter = getAdapter();
        const result = await adapter.create(table, data);
        clearCache(table); // Invalidar cache da tabela
        return result;
      } catch (error) {
        if (CONFIG.DEBUG.LOG_ERRORS) {
          console.error(`[DataService] Error in create(${table}):`, error);
        }
        throw error;
      }
    },
    
    /**
     * Atualizar um registo existente
     * @param {string} table - Nome da tabela
     * @param {string} id - ID do registo
     * @param {object} data - Dados a atualizar
     * @returns {Promise<object>}
     */
    async update(table, id, data) {
      try {
        const adapter = getAdapter();
        const result = await adapter.update(table, id, data);
        clearCache(table);
        return result;
      } catch (error) {
        if (CONFIG.DEBUG.LOG_ERRORS) {
          console.error(`[DataService] Error in update(${table}, ${id}):`, error);
        }
        throw error;
      }
    },
    
    /**
     * Eliminar um registo
     * @param {string} table - Nome da tabela
     * @param {string} id - ID do registo
     * @returns {Promise<boolean>}
     */
    async delete(table, id) {
      try {
        const adapter = getAdapter();
        const result = await adapter.delete(table, id);
        clearCache(table);
        return result;
      } catch (error) {
        if (CONFIG.DEBUG.LOG_ERRORS) {
          console.error(`[DataService] Error in delete(${table}, ${id}):`, error);
        }
        throw error;
      }
    },
    
    /**
     * Limpar cache
     * @param {string} table - Nome da tabela (opcional, limpa tudo se omitido)
     */
    clearCache(table) {
      clearCache(table);
    },
    
    /**
     * Definir dados mock (para testes)
     */
    setMockData(table, data) {
      MockAdapter.setMockData(table, data);
    },
    
    /**
     * Obter ID do utilizador atual
     */
    getCurrentUserId() {
      return CONFIG.APP.CURRENT_USER_ID;
    },
    
    /**
     * Executar RPC/Função (apenas Supabase)
     */
    async rpc(functionName, params = {}) {
      if (CONFIG.ENVIRONMENT === 'supabase') {
        return SupabaseAdapter.rpc(functionName, params);
      }
      throw new Error('RPC not available in this environment');
    }
  };
})();

// Exportar para uso global
window.DataService = DataService;
