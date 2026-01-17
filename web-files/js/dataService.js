// ===================================================================
// DATA SERVICE - Camada de Abstração para Supabase
// ===================================================================

const DataService = (function() {
  
  // Configuração Supabase
  const SUPABASE_URL = 'https://yujhfscnnngaivwwunom.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhmc2Nubm5nYWl2d3d1bm9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODA5OTEsImV4cCI6MjA4MDk1Njk5MX0.wpWiNx6ck_gEujMoodbFTswjBjMbuEHeAO8lMtLes2c';
  
  // Headers padrão para Supabase
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  // Expor URL e Headers para outros serviços
  function getBaseUrl() {
    return SUPABASE_URL;
  }
  
  function getHeaders() {
    return { ...headers };
  }
  
  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  
  async function retrieveMultipleRecords(entityName, options = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}`;
      const params = new URLSearchParams();
      
      if (options.select) {
        params.append('select', options.select);
      }
      
      if (options.filter) {
        Object.keys(options.filter).forEach(key => {
          const value = options.filter[key];
          if (typeof value === 'object') {
            Object.keys(value).forEach(op => {
              params.append(key, `${op}.${value[op]}`);
            });
          } else {
            params.append(key, `eq.${value}`);
          }
        });
      }
      
      if (options.orderby) {
        params.append('order', options.orderby);
      }
      
      if (options.top) {
        params.append('limit', options.top);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[DataService] Erro ao buscar ${entityName}:`, error);
      throw error;
    }
  }
  
  async function retrieveRecord(entityName, id, select = '*') {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}&select=${select}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`[DataService] Erro ao buscar registo ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  async function createRecord(entityName, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}`;
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${error}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    } catch (error) {
      console.error(`[DataService] Erro ao criar ${entityName}:`, error);
      throw error;
    }
  }
  
  async function updateRecord(entityName, id, data) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.length > 0 ? result[0] : result;
    } catch (error) {
      console.error(`[DataService] Erro ao atualizar ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  async function deleteRecord(entityName, id) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${entityName}?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`[DataService] Erro ao eliminar ${entityName}/${id}:`, error);
      throw error;
    }
  }
  
  async function retrieveWithRelations(entityName, select, filter = {}) {
    try {
      let url = `${SUPABASE_URL}/rest/v1/${entityName}?select=${encodeURIComponent(select)}`;
      
      Object.keys(filter).forEach(key => {
        const value = filter[key];
        if (value !== null && value !== undefined) {
          url += `&${key}=eq.${value}`;
        }
      });
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DataService] Erro response:`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`[DataService] Erro ao buscar ${entityName} com relações:`, error);
      throw error;
    }
  }
  
  // ==========================================
  // FUNÇÕES ESPECÍFICAS POR ENTIDADE
  // ==========================================
  
  async function getColaboradores() {
    return retrieveWithRelations('colaboradores', '*,departamentos(id,codigo,nome)', { ativo: true });
  }
  
  async function getColaboradorById(id) {
    const result = await retrieveWithRelations('colaboradores', '*,departamentos(id,codigo,nome)', { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function getDepartamentos() {
    return retrieveMultipleRecords('departamentos', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getFormadores() {
    return retrieveWithRelations('formadores', '*,entidades_formadoras(id,nome)', { ativo: true });
  }
  
  async function getEntidadesFormadoras() {
    return retrieveMultipleRecords('entidades_formadoras', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getFrota() {
    return retrieveMultipleRecords('frota', { orderby: 'modelo.asc' });
  }
  
  async function getFrotaDisponivel() {
    return retrieveMultipleRecords('frota', {
      filter: { disponivel: true },
      orderby: 'modelo.asc'
    });
  }
  
  async function getTiposTransporte() {
    return retrieveMultipleRecords('tipos_transporte', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  async function getTiposTransportePublico() {
    return retrieveMultipleRecords('tipos_transporte_publico', {
      filter: { ativo: true },
      orderby: 'nome.asc'
    });
  }
  
  // --- FORMAÇÕES ---
  async function getFormacoes() {
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo,colaborador_id),formacao_sessoes(id,data,hora_inicio,hora_fim,estado,codigo_entrada,codigo_saida,hora_abertura_entrada,hora_abertura_saida,hora_conclusao),formacao_inscricoes(id,colaborador_id,estado,tipo_inscricao,alocado_por,data_alocacao,notificacao_enviada,notificacao_lida),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,sessao_id,presente,hora_entrada,hora_saida,validado),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at,classificacao_geral),formacao_formadores(id,formador_id,entidade_id,principal,formadores(id,nome,colaborador_id),entidades_formadoras(id,nome)),formacao_anexos(id,nome,tipo,url,tamanho_bytes)';
    return retrieveWithRelations('formacoes', select);
  }
  
  async function getFormacaoById(id) {
    // CORRIGIDO: Adicionados hints de FK para resolver referências ambíguas
    // - formacao_inscricoes: colaborador via formacao_inscricoes_colaborador_id_fkey
    // - formacao_presencas: colaborador via formacao_presencas_colaborador_id_fkey
    const select = '*,entidades_formadoras(id,codigo,nome),formadores(id,nome,especialidade,tipo,colaborador_id),formacao_sessoes(id,data,hora_inicio,hora_fim,estado,codigo_entrada,codigo_saida,hora_abertura_entrada,hora_abertura_saida,hora_conclusao),formacao_inscricoes(id,colaborador_id,estado,tipo_inscricao,alocado_por,data_alocacao,notificacao_enviada,notificacao_lida,mensagem_alocacao,colaboradores!formacao_inscricoes_colaborador_id_fkey(id,nome,email,departamento_id)),formacao_departamentos(id,departamento_id,departamentos(id,codigo,nome)),formacao_favoritos(id,colaborador_id),formacao_presencas(id,colaborador_id,sessao_id,presente,hora_entrada,hora_saida,validado,colaboradores!formacao_presencas_colaborador_id_fkey(id,nome)),formacao_resultados(id,colaborador_id,resultado),formacao_avaliacoes(id,colaborador_id,score_conteudo,score_formador,score_organizacao,comentario,created_at,classificacao_geral,classificacao_conteudo,classificacao_formador,classificacao_organizacao),formacao_formadores(id,formador_id,entidade_id,principal,formadores!formacao_formadores_formador_id_fkey(id,nome,colaborador_id),entidades_formadoras!formacao_formadores_entidade_id_fkey(id,nome)),formacao_anexos(id,nome,tipo,url,tamanho_bytes)';
    const result = await retrieveWithRelations('formacoes', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createFormacao(data) {
    const { sessoes, departamentos_alvo, formadores_ids, entidades_ids, ...formacaoData } = data;
    const formacao = await createRecord('formacoes', formacaoData);
    
    if (sessoes && sessoes.length > 0) {
      for (const sessao of sessoes) {
        await createRecord('formacao_sessoes', {
          formacao_id: formacao.id,
          data: sessao.data,
          hora_inicio: sessao.hora_inicio || sessao.horaInicio,
          hora_fim: sessao.hora_fim || sessao.horaFim,
          estado: 'Agendada'
        });
      }
    }
    
    if (departamentos_alvo && departamentos_alvo.length > 0) {
      for (const depId of departamentos_alvo) {
        await createRecord('formacao_departamentos', {
          formacao_id: formacao.id,
          departamento_id: depId
        });
      }
    }
    
    // Múltiplos formadores
    if (formadores_ids && formadores_ids.length > 0) {
      for (let i = 0; i < formadores_ids.length; i++) {
        await createRecord('formacao_formadores', {
          formacao_id: formacao.id,
          formador_id: formadores_ids[i],
          principal: i === 0
        });
      }
    }
    
    // Múltiplas entidades
    if (entidades_ids && entidades_ids.length > 0) {
      for (let i = 0; i < entidades_ids.length; i++) {
        await createRecord('formacao_formadores', {
          formacao_id: formacao.id,
          entidade_id: entidades_ids[i],
          principal: !formadores_ids?.length && i === 0
        });
      }
    }
    
    return formacao;
  }
  
  async function updateFormacao(id, data) {
    return updateRecord('formacoes', id, data);
  }
  
  async function inscreverFormacao(formacaoId, colaboradorId, observacoes = null) {
    return createRecord('formacao_inscricoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      observacoes,
      estado: 'Inscrito',
      tipo_inscricao: 'voluntaria'
    });
  }
  
  async function cancelarInscricaoFormacao(formacaoId, colaboradorId) {
    const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (inscricoes.length > 0) {
      return updateRecord('formacao_inscricoes', inscricoes[0].id, {
        estado: 'Cancelada',
        cancelada_em: new Date().toISOString()
      });
    }
    return null;
  }
  
  // --- ALOCAÇÃO DE COLABORADORES ---
  
  // Alocar colaborador a uma formação (pelo gestor/RH)
  async function alocarColaboradorFormacao(formacaoId, colaboradorId, alocadoPorId, mensagem = null) {
    // Verificar se já está inscrito
    const inscricoesExistentes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (inscricoesExistentes.length > 0) {
      // Se já existe mas foi cancelada, reativar
      if (inscricoesExistentes[0].estado === 'Cancelada') {
        return updateRecord('formacao_inscricoes', inscricoesExistentes[0].id, {
          estado: 'Inscrito',
          tipo_inscricao: 'alocada',
          alocado_por: alocadoPorId,
          data_alocacao: new Date().toISOString(),
          mensagem_alocacao: mensagem,
          notificacao_enviada: true,
          notificacao_lida: false,
          cancelada_em: null
        });
      }
      // Se já está inscrito, não fazer nada
      return inscricoesExistentes[0];
    }
    
    // Criar nova inscrição do tipo 'alocada'
    return createRecord('formacao_inscricoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      estado: 'Inscrito',
      tipo_inscricao: 'alocada',
      alocado_por: alocadoPorId,
      data_alocacao: new Date().toISOString(),
      mensagem_alocacao: mensagem,
      notificacao_enviada: true,
      notificacao_lida: false
    });
  }
  
  // Remover alocação de colaborador
  async function removerAlocacaoFormacao(formacaoId, colaboradorId) {
    const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (inscricoes.length > 0) {
      return updateRecord('formacao_inscricoes', inscricoes[0].id, {
        estado: 'Cancelada',
        cancelada_em: new Date().toISOString()
      });
    }
    return null;
  }
  
  // --- NOTIFICAÇÕES DE FORMAÇÃO ---
  
  // Criar notificação genérica
  async function criarNotificacao(dados) {
    return createRecord('formacao_notificacoes', {
      colaborador_id: dados.colaborador_id,
      formacao_id: dados.referencia_id || dados.formacao_id,
      tipo: dados.tipo,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      lida: false
    });
  }
  
  // Criar notificação de alocação
  async function criarNotificacaoAlocacao(formacaoId, colaboradorId, tituloFormacao, mensagem = null) {
    return createRecord('formacao_notificacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      tipo: 'alocacao',
      titulo: `Alocação à formação: ${tituloFormacao}`,
      mensagem: mensagem || `Foi alocado/a à formação "${tituloFormacao}". Consulte os detalhes na sua área de formações.`,
      lida: false
    });
  }
  
  // Criar notificação de lembrete de sessão
  async function criarNotificacaoLembreteSessao(formacaoId, colaboradorId, tituloFormacao, dataSessao) {
    return createRecord('formacao_notificacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      tipo: 'lembrete_sessao',
      titulo: `Lembrete: Sessão de formação`,
      mensagem: `A sessão da formação "${tituloFormacao}" está agendada para ${dataSessao}.`,
      lida: false
    });
  }
  
  // Criar notificação de sessão iniciada
  async function criarNotificacaoSessaoIniciada(formacaoId, colaboradorId, tituloFormacao) {
    return createRecord('formacao_notificacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      tipo: 'sessao_iniciada',
      titulo: `Sessão iniciada: ${tituloFormacao}`,
      mensagem: `A sessão da formação "${tituloFormacao}" já iniciou. Registe a sua presença.`,
      lida: false
    });
  }
  
  // Criar notificação de questionário de avaliação
  async function criarNotificacaoQuestionario(formacaoId, colaboradorId, tituloFormacao, mensagem = null) {
    return createRecord('formacao_notificacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      tipo: 'questionario_formacao',
      titulo: `Avaliação de Formação`,
      mensagem: mensagem || `Por favor, avalie a formação "${tituloFormacao}" que frequentou recentemente.`,
      lida: false
    });
  }
  
  // Criar notificação de formação cancelada
  async function criarNotificacaoFormacaoCancelada(formacaoId, colaboradorId, tituloFormacao, motivo) {
    return createRecord('formacao_notificacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      tipo: 'formacao_cancelada',
      titulo: `Formação Cancelada`,
      mensagem: `A formação "${tituloFormacao}" foi cancelada. Motivo: ${motivo}`,
      lida: false
    });
  }
  
  // Obter notificações de um colaborador
  async function getNotificacoesColaborador(colaboradorId, apenasNaoLidas = false) {
    const select = '*,formacoes(id,titulo,estado)';
    let url = `${SUPABASE_URL}/rest/v1/formacao_notificacoes?select=${encodeURIComponent(select)}&colaborador_id=eq.${colaboradorId}&order=created_at.desc`;
    
    if (apenasNaoLidas) {
      url += '&lida=eq.false';
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
  
  // Marcar notificação como lida
  async function marcarNotificacaoLida(notificacaoId) {
    return updateRecord('formacao_notificacoes', notificacaoId, {
      lida: true,
      data_lida: new Date().toISOString()
    });
  }
  
  // Marcar todas notificações como lidas
  async function marcarTodasNotificacoesLidas(colaboradorId) {
    const notificacoes = await retrieveMultipleRecords('formacao_notificacoes', {
      filter: { colaborador_id: colaboradorId, lida: false }
    });
    
    for (const notif of notificacoes) {
      await updateRecord('formacao_notificacoes', notif.id, {
        lida: true,
        data_lida: new Date().toISOString()
      });
    }
    
    return notificacoes.length;
  }
  
  // Contar notificações não lidas
  async function contarNotificacoesNaoLidas(colaboradorId) {
    const notificacoes = await retrieveMultipleRecords('formacao_notificacoes', {
      filter: { colaborador_id: colaboradorId, lida: false }
    });
    return notificacoes.length;
  }
  
  // Marcar notificação de alocação como lida na inscrição
  async function marcarAlocacaoLida(formacaoId, colaboradorId) {
    const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (inscricoes.length > 0 && !inscricoes[0].notificacao_lida) {
      return updateRecord('formacao_inscricoes', inscricoes[0].id, {
        notificacao_lida: true,
        data_notificacao_lida: new Date().toISOString()
      });
    }
    return null;
  }
  
  // Obter formações onde o colaborador foi alocado (não lidas)
  async function getAlocacoesNaoLidas(colaboradorId) {
    const select = '*,formacoes(id,titulo,estado,duracao_horas,formacao_sessoes(id,data,hora_inicio))';
    let url = `${SUPABASE_URL}/rest/v1/formacao_inscricoes?select=${encodeURIComponent(select)}&colaborador_id=eq.${colaboradorId}&tipo_inscricao=eq.alocada&notificacao_lida=eq.false&estado=eq.Inscrito`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  }
  
  // ==========================================
  // VERIFICAÇÃO E CRIAÇÃO AUTOMÁTICA DE NOTIFICAÇÕES DE AVALIAÇÃO
  // ==========================================
  
  // Verificar avaliações pendentes e criar notificações se necessário
  async function verificarECriarNotificacoesAvaliacao(colaboradorId) {
    try {
      // 1. Obter formações concluídas onde o colaborador está inscrito
      const formacoes = await getFormacoes();
      const formacoesConcluidas = formacoes.filter(f => f.estado === 'Concluída');
      
      // 2. Verificar inscrições do colaborador
      const inscricoes = await retrieveMultipleRecords('formacao_inscricoes', {
        filter: { colaborador_id: colaboradorId, estado: 'Inscrito' }
      });
      
      const formacaoIdsInscritas = inscricoes.map(i => i.formacao_id);
      
      // 3. Obter avaliações já feitas pelo colaborador
      const avaliacoes = await retrieveMultipleRecords('formacao_avaliacoes', {
        filter: { colaborador_id: colaboradorId }
      });
      const formacaoIdsAvaliadas = avaliacoes.map(a => a.formacao_id);
      
      // 4. Obter notificações de avaliação existentes (para não duplicar)
      const notificacoesExistentes = await retrieveMultipleRecords('formacao_notificacoes', {
        filter: { colaborador_id: colaboradorId, tipo: 'questionario_formacao' }
      });
      const formacaoIdsComNotificacao = notificacoesExistentes.map(n => n.formacao_id);
      
      // 5. Encontrar formações concluídas que precisam de notificação
      const notificacoesCriadas = [];
      
      for (const formacao of formacoesConcluidas) {
        const estaInscrito = formacaoIdsInscritas.includes(formacao.id);
        const jaAvaliou = formacaoIdsAvaliadas.includes(formacao.id);
        const jaTemNotificacao = formacaoIdsComNotificacao.includes(formacao.id);
        
        if (estaInscrito && !jaAvaliou && !jaTemNotificacao) {
          // Criar notificação de avaliação pendente
          const notificacao = await criarNotificacaoQuestionario(
            formacao.id,
            colaboradorId,
            formacao.titulo,
            `A formação "${formacao.titulo}" foi concluída. Por favor, partilhe a sua opinião através do questionário de avaliação.`
          );
          notificacoesCriadas.push(notificacao);
          console.log(`[DataService] Notificação de avaliação criada para formação: ${formacao.titulo}`);
        }
      }
      
      return notificacoesCriadas;
    } catch (error) {
      console.error('[DataService] Erro ao verificar notificações de avaliação:', error);
      return [];
    }
  }
  
  // Obter notificações com verificação automática de avaliações pendentes
  async function getNotificacoesColaboradorCompletas(colaboradorId) {
    try {
      // Primeiro, verificar e criar notificações de avaliação se necessário
      await verificarECriarNotificacoesAvaliacao(colaboradorId);
      
      // Depois, obter todas as notificações
      return await getNotificacoesColaborador(colaboradorId);
    } catch (error) {
      console.error('[DataService] Erro ao obter notificações completas:', error);
      throw error;
    }
  }
  
  // Obter avaliações pendentes do colaborador (formações concluídas sem avaliação)
  async function getAvaliacoesPendentes(colaboradorId) {
    try {
      const formacoes = await getFormacoes();
      const formacoesConcluidas = formacoes.filter(f => f.estado === 'Concluída');
      
      const avaliacoesPendentes = [];
      
      for (const formacao of formacoesConcluidas) {
        const estaInscrito = (formacao.formacao_inscricoes || []).some(
          i => i.colaborador_id === colaboradorId && i.estado === 'Inscrito'
        );
        
        const jaAvaliou = (formacao.formacao_avaliacoes || []).some(
          a => a.colaborador_id === colaboradorId
        );
        
        if (estaInscrito && !jaAvaliou) {
          avaliacoesPendentes.push({
            formacao_id: formacao.id,
            titulo: formacao.titulo,
            data_conclusao: formacao.data_conclusao,
            tipo: 'avaliacao_pendente'
          });
        }
      }
      
      return avaliacoesPendentes;
    } catch (error) {
      console.error('[DataService] Erro ao obter avaliações pendentes:', error);
      return [];
    }
  }
  
  async function toggleFavoritoFormacao(formacaoId, colaboradorId) {
    const favoritos = await retrieveMultipleRecords('formacao_favoritos', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (favoritos.length > 0) {
      await deleteRecord('formacao_favoritos', favoritos[0].id);
      return false;
    } else {
      await createRecord('formacao_favoritos', {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId
      });
      return true;
    }
  }
  
  async function registarPresenca(formacaoId, colaboradorId, presente) {
    const presencas = await retrieveMultipleRecords('formacao_presencas', {
      filter: { formacao_id: formacaoId, colaborador_id: colaboradorId }
    });
    
    if (presencas.length > 0) {
      return updateRecord('formacao_presencas', presencas[0].id, { presente });
    } else {
      return createRecord('formacao_presencas', {
        formacao_id: formacaoId,
        colaborador_id: colaboradorId,
        presente
      });
    }
  }
  
  async function submeterAvaliacao(formacaoId, colaboradorId, avaliacao) {
    return createRecord('formacao_avaliacoes', {
      formacao_id: formacaoId,
      colaborador_id: colaboradorId,
      score_conteudo: avaliacao.conteudo,
      score_formador: avaliacao.formador,
      score_organizacao: avaliacao.organizacao,
      classificacao_geral: avaliacao.geral || avaliacao.classificacao_geral,
      classificacao_conteudo: avaliacao.conteudo || avaliacao.classificacao_conteudo,
      classificacao_formador: avaliacao.formador || avaliacao.classificacao_formador,
      classificacao_organizacao: avaliacao.organizacao || avaliacao.classificacao_organizacao,
      comentario: avaliacao.comentario,
      recomendaria: avaliacao.recomendaria
    });
  }
  
  // --- SESSÕES DE FORMAÇÃO ---
  
  // Gerar código de 6 dígitos aleatório
  function gerarCodigo6Digitos() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Obter sessão por ID com presenças
  async function getSessaoById(sessaoId) {
    // CORRIGIDO: Adicionado hint de FK para colaboradores em formacao_presencas
    const select = '*,formacoes(id,titulo),formacao_presencas(id,colaborador_id,hora_entrada,hora_saida,validado,colaboradores!formacao_presencas_colaborador_id_fkey(id,nome))';
    const result = await retrieveWithRelations('formacao_sessoes', select, { id: sessaoId });
    return result.length > 0 ? result[0] : null;
  }
  
  // Obter presenças de uma sessão
  async function getPresencasSessao(sessaoId) {
    const select = '*,colaboradores!formacao_presencas_colaborador_id_fkey(id,nome,email,departamentos(id,nome))';
    return retrieveWithRelations('formacao_presencas', select, { sessao_id: sessaoId });
  }
  
  // Iniciar sessão (gera código de entrada)
  async function iniciarSessao(sessaoId, userId) {
    const codigoEntrada = gerarCodigo6Digitos();
    return updateRecord('formacao_sessoes', sessaoId, {
      estado: 'Em Curso',
      codigo_entrada: codigoEntrada,
      hora_abertura_entrada: new Date().toISOString()
    });
  }
  
  // Abrir saída (gera código de saída)
  async function abrirSaidaSessao(sessaoId) {
    const codigoSaida = gerarCodigo6Digitos();
    return updateRecord('formacao_sessoes', sessaoId, {
      codigo_saida: codigoSaida,
      hora_abertura_saida: new Date().toISOString()
    });
  }
  
  // Regenerar código de entrada
  async function regenerarCodigoEntrada(sessaoId) {
    const novoCodigo = gerarCodigo6Digitos();
    return updateRecord('formacao_sessoes', sessaoId, {
      codigo_entrada: novoCodigo
    });
  }
  
  // Regenerar código de saída
  async function regenerarCodigoSaida(sessaoId) {
    const novoCodigo = gerarCodigo6Digitos();
    return updateRecord('formacao_sessoes', sessaoId, {
      codigo_saida: novoCodigo
    });
  }
  
  // Concluir sessão
  async function concluirSessao(sessaoId, userId) {
    return updateRecord('formacao_sessoes', sessaoId, {
      estado: 'Concluída',
      hora_conclusao: new Date().toISOString(),
      concluida_por: userId
    });
  }
  
  // Cancelar sessão
  async function cancelarSessao(sessaoId, motivo, userId) {
    return updateRecord('formacao_sessoes', sessaoId, {
      estado: 'Cancelada',
      motivo_cancelamento: motivo,
      hora_conclusao: new Date().toISOString(),
      concluida_por: userId
    });
  }
  
  // Verificar e atualizar estado da formação baseado nas sessões
  async function verificarEstadoFormacao(formacaoId) {
    const formacao = await getFormacaoById(formacaoId);
    if (!formacao) return null;
    
    const sessoes = formacao.formacao_sessoes || [];
    if (sessoes.length === 0) return formacao;
    
    const todasConcluidas = sessoes.every(s => s.estado === 'Concluída');
    const todasCanceladas = sessoes.every(s => s.estado === 'Cancelada');
    const algumaEmCurso = sessoes.some(s => s.estado === 'Em Curso');
    
    let novoEstado = formacao.estado;
    
    if (todasConcluidas) {
      novoEstado = 'Concluída';
    } else if (todasCanceladas) {
      novoEstado = 'Cancelada';
    } else if (algumaEmCurso) {
      novoEstado = 'Em Curso';
    }
    
    if (novoEstado !== formacao.estado) {
      await updateFormacao(formacaoId, { estado: novoEstado });
    }
    
    return { ...formacao, estado: novoEstado };
  }
  
  // Registar presença manual (pelo formador)
  async function registarPresencaManual(sessaoId, formacaoId, colaboradorId, tipoMarcacao, userId) {
    const presencas = await retrieveMultipleRecords('formacao_presencas', {
      filter: { sessao_id: sessaoId, colaborador_id: colaboradorId }
    });
    
    const agora = new Date().toISOString();
    
    if (presencas.length > 0) {
      const updateData = {};
      if (tipoMarcacao === 'entrada') {
        updateData.hora_entrada = agora;
        updateData.metodo_entrada = 'manual';
      } else if (tipoMarcacao === 'saida') {
        updateData.hora_saida = agora;
        updateData.metodo_saida = 'manual';
        updateData.validado = true;
      } else if (tipoMarcacao === 'ambos') {
        updateData.hora_entrada = agora;
        updateData.hora_saida = agora;
        updateData.metodo_entrada = 'manual';
        updateData.metodo_saida = 'manual';
        updateData.validado = true;
      }
      return updateRecord('formacao_presencas', presencas[0].id, updateData);
    } else {
      const createData = {
        formacao_id: formacaoId,
        sessao_id: sessaoId,
        colaborador_id: colaboradorId,
        presente: true,
        metodo_entrada: 'manual'
      };
      if (tipoMarcacao === 'entrada' || tipoMarcacao === 'ambos') {
        createData.hora_entrada = agora;
      }
      if (tipoMarcacao === 'saida' || tipoMarcacao === 'ambos') {
        createData.hora_saida = agora;
        createData.metodo_saida = 'manual';
        createData.validado = true;
      }
      return createRecord('formacao_presencas', createData);
    }
  }
  
  // Remover presença
  async function removerPresenca(presencaId) {
    return deleteRecord('formacao_presencas', presencaId);
  }
  
  // Obter formações onde o utilizador é formador
  async function getFormacoesDoFormador(colaboradorId) {
    // Primeiro encontrar o formador associado ao colaborador
    const formadores = await retrieveMultipleRecords('formadores', {
      filter: { colaborador_id: colaboradorId, ativo: true }
    });
    
    if (formadores.length === 0) {
      return [];
    }
    
    const formadorId = formadores[0].id;
    
    // Buscar formações onde este formador está associado
    const formacaoFormadores = await retrieveMultipleRecords('formacao_formadores', {
      filter: { formador_id: formadorId }
    });
    
    if (formacaoFormadores.length === 0) {
      return [];
    }
    
    // Buscar detalhes completos das formações
    const formacaoIds = formacaoFormadores.map(ff => ff.formacao_id);
    const formacoes = await getFormacoes();
    
    return formacoes.filter(f => formacaoIds.includes(f.id));
  }
  
  // --- ANEXOS DE FORMAÇÃO ---
  async function getFormacaoAnexos(formacaoId) {
    return retrieveMultipleRecords('formacao_anexos', {
      filter: { formacao_id: formacaoId },
      orderby: 'created_at.desc'
    });
  }
  
  async function createFormacaoAnexo(formacaoId, nome, tipo, url, tamanhoBytes = null, createdBy = null) {
    return createRecord('formacao_anexos', {
      formacao_id: formacaoId,
      nome,
      tipo,
      url,
      tamanho_bytes: tamanhoBytes,
      created_by: createdBy
    });
  }
  
  async function deleteFormacaoAnexo(anexoId) {
    return deleteRecord('formacao_anexos', anexoId);
  }
  
  // --- PEDIDOS DE FORMAÇÃO ---
  async function getPedidosFormacao() {
    const select = '*,solicitante:colaboradores!pedidos_formacao_solicitante_id_fkey(id,nome,email,departamento_id,departamentos(id,codigo,nome)),departamentos(id,codigo,nome),dirigente:colaboradores!pedidos_formacao_dirigente_id_fkey(id,nome),rh_aprovador:colaboradores!pedidos_formacao_rh_aprovador_id_fkey(id,nome),pedidos_formacao_historico(id,acao,estado_anterior,estado_novo,comentario,user_id,user_nome,created_at)';
    return retrieveWithRelations('pedidos_formacao', select);
  }
  
  // Obter pedidos de formação do utilizador atual
  async function getMyPedidosFormacao(colaboradorId) {
    const select = '*,solicitante:colaboradores!pedidos_formacao_solicitante_id_fkey(id,nome,email,departamento_id,departamentos(id,codigo,nome)),departamentos(id,codigo,nome),dirigente:colaboradores!pedidos_formacao_dirigente_id_fkey(id,nome),rh_aprovador:colaboradores!pedidos_formacao_rh_aprovador_id_fkey(id,nome),pedidos_formacao_historico(id,acao,estado_anterior,estado_novo,comentario,user_id,user_nome,created_at)';
    return retrieveWithRelations('pedidos_formacao', select, { solicitante_id: colaboradorId });
  }
  
  async function getPedidoFormacaoById(id) {
    const select = '*,solicitante:colaboradores!pedidos_formacao_solicitante_id_fkey(id,nome,email,departamento_id,departamentos(id,codigo,nome)),departamentos(id,codigo,nome),dirigente:colaboradores!pedidos_formacao_dirigente_id_fkey(id,nome),rh_aprovador:colaboradores!pedidos_formacao_rh_aprovador_id_fkey(id,nome),pedidos_formacao_historico(id,acao,estado_anterior,estado_novo,comentario,user_id,user_nome,created_at)';
    const result = await retrieveWithRelations('pedidos_formacao', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createPedidoFormacao(data) {
    return createRecord('pedidos_formacao', data);
  }
  
  async function updatePedidoFormacao(id, data) {
    return updateRecord('pedidos_formacao', id, data);
  }
  
  async function aprovarPedidoDirigente(pedidoId, dirigenteId, comentario = '') {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'pendente_rh',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'aprovado',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function rejeitarPedidoDirigente(pedidoId, dirigenteId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'rejeitado',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'rejeitado',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function devolverPedidoDirigente(pedidoId, dirigenteId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'devolvido',
      dirigente_id: dirigenteId,
      dirigente_decisao: 'devolvido',
      dirigente_comentario: comentario,
      dirigente_data: new Date().toISOString()
    });
  }
  
  async function aprovarPedidoRH(pedidoId, rhId, comentario = '') {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'aprovado',
      rh_aprovador_id: rhId,
      rh_decisao: 'aprovado',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function rejeitarPedidoRH(pedidoId, rhId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'rejeitado',
      rh_aprovador_id: rhId,
      rh_decisao: 'rejeitado',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function devolverPedidoRH(pedidoId, rhId, comentario) {
    return updateRecord('pedidos_formacao', pedidoId, {
      estado: 'devolvido',
      rh_aprovador_id: rhId,
      rh_decisao: 'devolvido',
      rh_comentario: comentario,
      rh_data: new Date().toISOString()
    });
  }
  
  async function addHistoricoPedido(pedidoId, acao, userId, userName, comentario = '', estadoAnterior = null, estadoNovo = null) {
    return createRecord('pedidos_formacao_historico', {
      pedido_id: pedidoId,
      acao,
      user_id: userId,
      user_nome: userName,
      comentario,
      estado_anterior: estadoAnterior,
      estado_novo: estadoNovo
    });
  }
  
  // --- DESLOCAÇÕES ---
  async function getDeslocacoes() {
    const select = '*,criador:colaboradores!deslocacoes_criado_por_fkey(id,nome),deslocacao_colaboradores(id,colaborador_id,ordem,colaboradores!deslocacao_colaboradores_colaborador_id_fkey(id,nome,departamento_id,departamentos(id,nome))),deslocacao_transportes(id,tipo_transporte_id,viatura_id,tipo_publico_id,motorista_id,ordem,observacoes,tipos_transporte(id,codigo,nome,requer_motorista,requer_viatura),frota(id,matricula,modelo,tipo,lugares),tipos_transporte_publico(id,codigo,nome),motorista:colaboradores!deslocacao_transportes_motorista_id_fkey(id,nome)),deslocacao_anexos(id,nome_ficheiro,url,tipo_ficheiro)';
    return retrieveWithRelations('deslocacoes', select);
  }
  
  async function getDeslocacaoById(id) {
    const select = '*,criador:colaboradores!deslocacoes_criado_por_fkey(id,nome),deslocacao_colaboradores(id,colaborador_id,ordem,colaboradores!deslocacao_colaboradores_colaborador_id_fkey(id,nome,departamento_id,departamentos(id,nome))),deslocacao_transportes(id,tipo_transporte_id,viatura_id,tipo_publico_id,motorista_id,ordem,observacoes,tipos_transporte(id,codigo,nome,requer_motorista,requer_viatura),frota(id,matricula,modelo,tipo,lugares),tipos_transporte_publico(id,codigo,nome),motorista:colaboradores!deslocacao_transportes_motorista_id_fkey(id,nome)),deslocacao_anexos(id,nome_ficheiro,url,tipo_ficheiro)';
    const result = await retrieveWithRelations('deslocacoes', select, { id });
    return result.length > 0 ? result[0] : null;
  }
  
  async function createDeslocacao(data) {
    const { colaboradores, transportes, anexos, ...deslocacaoData } = data;
    const deslocacao = await createRecord('deslocacoes', deslocacaoData);
    
    if (colaboradores && colaboradores.length > 0) {
      for (let i = 0; i < colaboradores.length; i++) {
        await createRecord('deslocacao_colaboradores', {
          deslocacao_id: deslocacao.id,
          colaborador_id: colaboradores[i],
          ordem: i + 1
        });
      }
    }
    
    if (transportes && transportes.length > 0) {
      for (let i = 0; i < transportes.length; i++) {
        const t = transportes[i];
        await createRecord('deslocacao_transportes', {
          deslocacao_id: deslocacao.id,
          tipo_transporte_id: t.tipo_transporte_id,
          viatura_id: t.viatura_id || null,
          tipo_publico_id: t.tipo_publico_id || null,
          motorista_id: t.motorista_id || null,
          ordem: i + 1,
          observacoes: t.observacoes || null
        });
      }
    }
    
    return deslocacao;
  }
  
  async function updateDeslocacao(id, data) {
    return updateRecord('deslocacoes', id, data);
  }
  
  async function deleteDeslocacao(id) {
    const colaboradores = await retrieveMultipleRecords('deslocacao_colaboradores', { filter: { deslocacao_id: id } });
    for (const c of colaboradores) {
      await deleteRecord('deslocacao_colaboradores', c.id);
    }
    
    const transportes = await retrieveMultipleRecords('deslocacao_transportes', { filter: { deslocacao_id: id } });
    for (const t of transportes) {
      await deleteRecord('deslocacao_transportes', t.id);
    }
    
    const anexos = await retrieveMultipleRecords('deslocacao_anexos', { filter: { deslocacao_id: id } });
    for (const a of anexos) {
      await deleteRecord('deslocacao_anexos', a.id);
    }
    
    return deleteRecord('deslocacoes', id);
  }
  
  // ==========================================
  // INVENTÁRIO - Artigos Atribuídos ao Colaborador
  // ==========================================
  
  async function getArtigosAtribuidosColaborador(colaboradorId) {
    const select = '*,artigos_inventario(id,codigo,nome,descricao,categorias_inventario(id,codigo,nome))';
    return retrieveWithRelations('atribuicoes_inventario', select, { 
      colaborador_id: colaboradorId,
      estado: 'Ativo'
    });
  }
  
  // ==========================================
  // DESLOCAÇÕES DO COLABORADOR
  // ==========================================
  
  async function getDeslocacoesColaborador(colaboradorId) {
    try {
      // Buscar todas as deslocações
      const deslocacoes = await getDeslocacoes();
      
      // Filtrar deslocações onde o colaborador está envolvido
      return deslocacoes.filter(d => {
        // Verificar se é o criador
        if (d.criado_por === colaboradorId) return true;
        
        // Verificar se está na lista de colaboradores
        const envolvido = (d.deslocacao_colaboradores || []).some(
          dc => dc.colaborador_id === colaboradorId
        );
        
        return envolvido;
      });
    } catch (error) {
      console.error('[DataService] Erro ao obter deslocações do colaborador:', error);
      return [];
    }
  }
  
  // ==========================================
  // ESTATÍSTICAS
  // ==========================================
  
  async function getFormacaoStats(colaboradorId = null) {
    const formacoes = await getFormacoes();
    
    let agendadas = 0;
    let inscritos = 0;
    let concluidas = 0;
    let avaliacoesPendentes = 0;
    
    formacoes.forEach(f => {
      if (f.estado === 'Agendada' || f.estado === 'Em Curso') agendadas++;
      if (f.estado === 'Concluída') concluidas++;
      
      const inscricoesAtivas = (f.formacao_inscricoes || []).filter(i => i.estado === 'Inscrito');
      inscritos += inscricoesAtivas.length;
      
      if (colaboradorId) {
        const estaInscrito = inscricoesAtivas.some(i => i.colaborador_id === colaboradorId);
        const jaAvaliou = (f.formacao_avaliacoes || []).some(a => a.colaborador_id === colaboradorId);
        if (f.estado === 'Concluída' && estaInscrito && !jaAvaliou) {
          avaliacoesPendentes++;
        }
      }
    });
    
    return { agendadas, inscritos, concluidas, avaliacoesPendentes };
  }
  
  async function getDeslocacaoStats(colaboradorId = null) {
    const deslocacoes = await getDeslocacoes();
    
    let total = deslocacoes.length;
    let pendentes = deslocacoes.filter(d => d.estado === 'Pendente Aprovação').length;
    let aprovadas = deslocacoes.filter(d => d.estado === 'Aprovada').length;
    let rascunhos = deslocacoes.filter(d => d.estado === 'Rascunho').length;
    
    return { total, pendentes, aprovadas, rascunhos };
  }
  
  // Função auxiliar para limpar prefixos de nomes
  function cleanFormadorName(nome) {
    if (!nome) return '';
    return nome.replace(/^(Dra?\.?|Eng\.?|Prof\.?|Sr\.?a?)\s*/gi, '').trim();
  }
  
  // ==========================================
  // API PÚBLICA
  // ==========================================
  
  return {
    // Configuração (para outros serviços)
    getBaseUrl,
    getHeaders,
    
    // Funções genéricas
    retrieveMultipleRecords,
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    retrieveWithRelations,
    
    // Colaboradores
    getColaboradores,
    getColaboradorById,
    
    // Departamentos
    getDepartamentos,
    
    // Formadores
    getFormadores,
    
    // Entidades Formadoras
    getEntidadesFormadoras,
    
    // Frota
    getFrota,
    getFrotaDisponivel,
    
    // Tipos de Transporte
    getTiposTransporte,
    getTiposTransportePublico,
    
    // Formações
    getFormacoes,
    getFormacaoById,
    createFormacao,
    updateFormacao,
    inscreverFormacao,
    cancelarInscricaoFormacao,
    toggleFavoritoFormacao,
    registarPresenca,
    submeterAvaliacao,
    getFormacaoStats,
    getFormacoesDoFormador,
    
    // Alocação de Colaboradores
    alocarColaboradorFormacao,
    removerAlocacaoFormacao,
    
    // Notificações de Formação
    criarNotificacao,
    criarNotificacaoAlocacao,
    criarNotificacaoLembreteSessao,
    criarNotificacaoSessaoIniciada,
    criarNotificacaoQuestionario,
    criarNotificacaoFormacaoCancelada,
    getNotificacoesColaborador,
    getNotificacoesColaboradorCompletas,
    verificarECriarNotificacoesAvaliacao,
    getAvaliacoesPendentes,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
    contarNotificacoesNaoLidas,
    marcarAlocacaoLida,
    getAlocacoesNaoLidas,
    
    // Sessões de Formação
    getSessaoById,
    getPresencasSessao,
    iniciarSessao,
    abrirSaidaSessao,
    regenerarCodigoEntrada,
    regenerarCodigoSaida,
    concluirSessao,
    cancelarSessao,
    verificarEstadoFormacao,
    registarPresencaManual,
    removerPresenca,
    gerarCodigo6Digitos,
    
    // Anexos de Formação
    getFormacaoAnexos,
    createFormacaoAnexo,
    deleteFormacaoAnexo,
    
    // Pedidos de Formação
    getPedidosFormacao,
    getMyPedidosFormacao,
    getPedidoFormacaoById,
    createPedidoFormacao,
    updatePedidoFormacao,
    aprovarPedidoDirigente,
    rejeitarPedidoDirigente,
    devolverPedidoDirigente,
    aprovarPedidoRH,
    rejeitarPedidoRH,
    devolverPedidoRH,
    addHistoricoPedido,
    
    // Deslocações
    getDeslocacoes,
    getDeslocacaoById,
    createDeslocacao,
    updateDeslocacao,
    deleteDeslocacao,
    getDeslocacaoStats,
    getDeslocacoesColaborador,
    
    // Inventário
    getArtigosAtribuidosColaborador,
    
    // Utilitários
    cleanFormadorName
  };
  
})();

window.DataService = DataService;
