/**
 * relatorio-contas-app.js
 * Orquestrador principal do Gerador de Relatório e Contas
 * Gere o fluxo da aplicação: upload → validação → pré-visualização → geração Word
 */
var RCApp = (function() {
    'use strict';
    var state = { balancete: null, hasComparativo: false, balancoN: null, balancoAnt: null, drN: null, drAnt: null, dacp: null, dfc: null, indicadores: null, empresa: {}, mappingLoaded: false, currentStep: 1 };
    var LOCAL_STORAGE_KEY = 'rc_app_dados';

    function init() {
        console.log('[RC App] A inicializar...');
        var baseUrl = document.querySelector('meta[name="baseurl"]');
        var base = baseUrl ? baseUrl.getAttribute('content') : '';
        SNCMapper.loadMapping(base + '/web-files/js/finance-hub/mapping-ncrf.json')
            .then(function() { state.mappingLoaded = true; console.log('[RC App] Mapeamento SNC carregado'); })
            .catch(function(err) { console.error('[RC App] Erro mapeamento:', err); showMessage('Erro ao carregar configuração SNC. Recarregue a página.', 'error'); });
        setupFileUpload();
        setupFormListeners();
        loadFromLocalStorage();
        showStep(1);
        // Verificar se docx.js carregou
        setTimeout(function() {
            if (!window.docx) {
                console.warn('[RC App] AVISO: docx.js não detectada após 5s. A geração de Word pode falhar.');
            } else {
                console.log('[RC App] docx.js detectada: v' + (window.docx.version || 'desconhecida'));
            }
        }, 5000);
    }

    function setupFileUpload() {
        var dropZone = document.getElementById('dropZone');
        var fileInput = document.getElementById('excelFile');
        if (!dropZone || !fileInput) { console.error('[RC App] dropZone ou excelFile não encontrado!'); return; }
        dropZone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
        dropZone.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); dropZone.classList.remove('drag-over'); });
        dropZone.addEventListener('drop', function(e) { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });
        fileInput.addEventListener('change', function(e) { if (e.target.files.length > 0) handleFile(e.target.files[0]); });
        console.log('[RC App] Upload configurado com sucesso');
    }

    function handleFile(file) {
        console.log('[RC App] Ficheiro recebido:', file.name, file.size, 'bytes');
        var validExts = ['.xlsx', '.xls'];
        var ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (validExts.indexOf(ext) === -1) { showMessage('Ficheiro inválido. Carregue um ficheiro Excel (.xlsx ou .xls).', 'error'); return; }
        showMessage('A processar ficheiro...', 'info');
        updateFileInfo(file.name, 'A ler...');
        ExcelReader.readFile(file).then(function(result) {
            console.log('[RC App] Excel lido:', result.totalContas, 'contas,', result.errors.length, 'erros,', result.warnings.length, 'avisos');
            if (result.errors.length > 0) { showValidation(result.errors, result.warnings); updateFileInfo(file.name, 'Erros encontrados'); return; }
            state.balancete = result.data;
            state.hasComparativo = result.hasComparativo;
            updateFileInfo(file.name, result.totalContas + ' contas lidas na folha "' + result.folha + '"');
            var validacao = ExcelReader.validateBalancete(result.data);
            var allWarnings = result.warnings.concat(validacao.warnings);
            if (!validacao.isValid) { showValidation(validacao.errors, allWarnings); }
            else if (allWarnings.length > 0) { showValidation([], allWarnings); }
            else { showMessage('Balancete carregado e validado com sucesso!', 'success'); }
            var btnProsseguir = document.getElementById('btnProsseguir');
            if (btnProsseguir) btnProsseguir.disabled = false;
        }).catch(function(err) { console.error('[RC App] Erro leitura Excel:', err); showMessage(err.message, 'error'); updateFileInfo('', 'Erro'); });
    }

    function processarDados() {
        if (!state.balancete || !state.mappingLoaded) { showMessage('Carregue um ficheiro Excel e aguarde o carregamento do mapeamento.', 'error'); return; }
        try {
            state.empresa = { denominacao: getVal('empDenominacao'), nif: getVal('empNIF'), sede: getVal('empSede'), cae: getVal('empCAE'), capital_social: getVal('empCapitalSocial'), exercicio: getVal('empExercicio'), data_fecho: getVal('empDataFecho'), normativo: getVal('empNormativo'), contabilista: getVal('empContabilista'), exercicio_comparativo: getVal('empExercicioComp') };
            SNCMapper.setBalancete(state.balancete);
            state.balancoN = SNCMapper.processarBalanco('atual');
            if (state.hasComparativo) { state.balancoAnt = SNCMapper.processarBalanco('anterior'); }
            state.drN = SNCMapper.processarDR('atual');
            if (state.hasComparativo) { state.drAnt = SNCMapper.processarDR('anterior'); }
            var rlDR = state.drN.subtotais.RL;
            state.balancoN.capital_proprio.rubricas.forEach(function(r) { if (r.id === 'RLP') r.valor = rlDR; });
            state.balancoN.capital_proprio.total = state.balancoN.capital_proprio.rubricas.reduce(function(sum, r) { return sum + (r.valor || 0); }, 0);
            state.balancoN.cp_passivo_total = state.balancoN.capital_proprio.total + state.balancoN.passivo_total;
            state.dacp = SNCMapper.processarDACP();
            state.dfc = SNCMapper.processarDFC(state.drN, state.balancoN, state.balancoAnt);
            state.indicadores = Calculator.calcularIndicadores(state.balancoN, state.drN);
            var avisos = Calculator.verificarConsistencia(state.balancoN, state.drN, state.dfc);
            renderPreview();
            if (avisos.length > 0) renderAvisos(avisos);
            showStep(2);
            console.log('[RC App] Dados processados com sucesso. RL:', rlDR);
        } catch (err) { console.error('[RC App] Erro ao processar:', err); showMessage('Erro ao processar: ' + err.message, 'error'); }
    }

    function renderPreview() {
        renderTablePreview('previewBalanco', state.balancoN, state.balancoAnt, state.empresa.exercicio);
        renderDRPreview('previewDR', state.drN, state.drAnt, state.empresa.exercicio);
        renderIndicadoresPreview('previewIndicadores', state.indicadores);
    }

    function renderTablePreview(containerId, balancoN, balancoAnt, exercicio) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var fmtPT = Calculator.formatPT;
        var exercicioAnt = balancoAnt ? (parseInt(exercicio) - 1) : 'N-1';
        var cols = balancoAnt ? 3 : 2;
        var html = '<table class="preview-table"><thead><tr><th>Rubricas</th><th class="num">' + (exercicio||'N') + '</th>';
        if (balancoAnt) html += '<th class="num">' + exercicioAnt + '</th>';
        html += '</tr></thead><tbody>';
        [{key:'ativo_nao_corrente',titulo:'ATIVO NÃO CORRENTE'},{key:'ativo_corrente',titulo:'ATIVO CORRENTE'}].forEach(function(sec) {
            html += '<tr class="section-header"><td colspan="'+cols+'">' + sec.titulo + '</td></tr>';
            balancoN[sec.key].rubricas.forEach(function(r) {
                if (r.valor === 0 && (!balancoAnt || SNCMapper.getValorRubrica(balancoAnt, r.id) === 0)) return;
                html += '<tr><td class="indent">' + r.nome + '</td><td class="num">' + fmtPT(r.valor,0) + '</td>';
                if (balancoAnt) html += '<td class="num">' + fmtPT(SNCMapper.getValorRubrica(balancoAnt, r.id),0) + '</td>';
                html += '</tr>';
            });
            html += '<tr class="subtotal"><td>Total ' + sec.titulo.charAt(0)+sec.titulo.slice(1).toLowerCase() + '</td><td class="num">' + fmtPT(balancoN[sec.key].total,0) + '</td>';
            if (balancoAnt) html += '<td class="num">' + fmtPT(balancoAnt[sec.key].total,0) + '</td>';
            html += '</tr>';
        });
        html += '<tr class="total"><td>TOTAL DO ATIVO</td><td class="num">' + fmtPT(balancoN.ativo_total,0) + '</td>';
        if (balancoAnt) html += '<td class="num">' + fmtPT(balancoAnt.ativo_total,0) + '</td>';
        html += '</tr><tr><td colspan="'+cols+'">&nbsp;</td></tr>';
        [{key:'capital_proprio',titulo:'CAPITAL PRÓPRIO'},{key:'passivo_nao_corrente',titulo:'PASSIVO NÃO CORRENTE'},{key:'passivo_corrente',titulo:'PASSIVO CORRENTE'}].forEach(function(sec) {
            html += '<tr class="section-header"><td colspan="'+cols+'">' + sec.titulo + '</td></tr>';
            balancoN[sec.key].rubricas.forEach(function(r) {
                if (r.valor !== null && r.valor !== 0) {
                    html += '<tr><td class="indent">' + r.nome + '</td><td class="num">' + fmtPT(r.valor,0) + '</td>';
                    if (balancoAnt) html += '<td class="num">' + fmtPT(SNCMapper.getValorRubrica(balancoAnt, r.id),0) + '</td>';
                    html += '</tr>';
                }
            });
            html += '<tr class="subtotal"><td>Total ' + sec.titulo.charAt(0)+sec.titulo.slice(1).toLowerCase() + '</td><td class="num">' + fmtPT(balancoN[sec.key].total,0) + '</td>';
            if (balancoAnt) html += '<td class="num">' + fmtPT(balancoAnt[sec.key].total,0) + '</td>';
            html += '</tr>';
        });
        html += '<tr class="total"><td>TOTAL DO CAPITAL PRÓPRIO E PASSIVO</td><td class="num">' + fmtPT(balancoN.cp_passivo_total,0) + '</td>';
        if (balancoAnt) html += '<td class="num">' + fmtPT(balancoAnt.cp_passivo_total,0) + '</td>';
        html += '</tr></tbody></table>';
        container.innerHTML = html;
    }

    function renderDRPreview(containerId, drN, drAnt, exercicio) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var fmtPT = Calculator.formatPT;
        var exercicioAnt = drAnt ? (parseInt(exercicio) - 1) : null;
        var html = '<table class="preview-table"><thead><tr><th>Rubricas</th><th class="num">' + (exercicio||'N') + '</th>';
        if (drAnt) html += '<th class="num">' + exercicioAnt + '</th>';
        html += '</tr></thead><tbody>';
        drN.rubricas.forEach(function(r) {
            var valN = r.tipo === 'gasto' || r.tipo === 'gasto_liquido' ? -r.valor : r.valor;
            var valAnt = drAnt ? (r.tipo === 'gasto' || r.tipo === 'gasto_liquido' ? -(drAnt.valores[r.id]||0) : (drAnt.valores[r.id]||0)) : null;
            if (valN === 0 && (valAnt === null || valAnt === 0)) return;
            html += '<tr><td class="indent">' + r.nome + '</td><td class="num">' + fmtPT(valN,0) + '</td>';
            if (drAnt) html += '<td class="num">' + fmtPT(valAnt,0) + '</td>';
            html += '</tr>';
        });
        [{nome:'EBITDA',key:'EBITDA'},{nome:'Resultado operacional (EBIT)',key:'EBIT'},{nome:'Resultado antes de impostos',key:'RAI'},{nome:'RESULTADO LÍQUIDO DO PERÍODO',key:'RL'}].forEach(function(s) {
            var cls = s.key === 'RL' ? 'total' : 'subtotal';
            html += '<tr class="'+cls+'"><td>' + s.nome + '</td><td class="num">' + fmtPT(drN.subtotais[s.key],0) + '</td>';
            if (drAnt) html += '<td class="num">' + fmtPT(drAnt.subtotais[s.key],0) + '</td>';
            html += '</tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderIndicadoresPreview(containerId, indicadores) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var html = '<table class="preview-table indicators-table"><thead><tr><th>Indicador</th><th class="num">Valor</th><th>Fórmula</th></tr></thead><tbody>';
        indicadores.forEach(function(ind) { html += '<tr><td><strong>' + ind.nome + '</strong></td><td class="num">' + Calculator.formatarIndicador(ind) + '</td><td class="formula">' + ind.descricao + '</td></tr>'; });
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function renderAvisos(avisos) {
        var container = document.getElementById('consistencyWarnings');
        if (!container || avisos.length === 0) return;
        var html = '<div class="rc-alert rc-alert-warning"><strong>Avisos de Consistência:</strong><ul>';
        avisos.forEach(function(a) { html += '<li>' + a.mensagem + '</li>'; });
        html += '</ul></div>';
        container.innerHTML = html;
        container.style.display = 'block';
    }

    /**
     * Gera o ficheiro Word - com try-catch global e alert() como fallback
     */
    function gerarWord() {
        console.log('[RC App] gerarWord() chamado. Estado:', state.balancoN ? 'processado' : 'NÃO processado');
        
        // Validação inicial com feedback visível
        if (!state.balancoN || !state.drN) {
            var msg = 'Ainda não processou os dados. Volte ao Passo 1, carregue o balancete Excel e clique em "Processar e Pré-visualizar".';
            showMessage(msg, 'error');
            alert(msg);
            return;
        }
        
        // Verificar se docx.js está disponível
        if (!window.docx) {
            var msgDocx = 'A biblioteca docx.js não foi carregada. Verifique a sua ligação à internet e recarregue a página.';
            showMessage(msgDocx, 'error');
            alert(msgDocx);
            return;
        }
        
        try {
            showMessage('A gerar ficheiro Word... Aguarde.', 'info');
            
            var notas = { descricao_atividade: getVal('notaDescricaoAtividade'), eventos_relevantes: getVal('notaEventosRelevantes'), eventos_pos_balanco: getVal('notaEventosPosBalanco'), passivos_contingentes: getVal('notaPassivosContingentes'), partes_relacionadas: getVal('notaPartesRelacionadas'), honorarios_roc: getVal('notaHonorariosROC'), outras_informacoes: getVal('notaOutrasInformacoes') };
            var relatorioGestao = getVal('relatorioGestao');
            saveToLocalStorage(notas, relatorioGestao);
            
            var balancoClone = JSON.parse(JSON.stringify(state.balancoN));
            balancoClone.capital_proprio.rubricas.forEach(function(r) { if (r.id === 'RLP') { balancoClone.capital_proprio.total -= r.valor || 0; r.valor = null; } });
            balancoClone.cp_passivo_total = balancoClone.capital_proprio.total + balancoClone.passivo_total;
            
            var dados = { empresa: state.empresa, balancoN: balancoClone, balancoAnt: state.balancoAnt, drN: state.drN, drAnt: state.drAnt, dacp: state.dacp, dfc: state.dfc, indicadores: state.indicadores, relatorioGestao: relatorioGestao, notas: notas };
            
            WordGenerator.gerarEDescarregar(dados)
                .then(function(fileName) {
                    console.log('[RC App] Word gerado:', fileName);
                    showMessage('Ficheiro "' + fileName + '" gerado com sucesso! Verifique os seus downloads.', 'success');
                })
                .catch(function(err) {
                    console.error('[RC App] Erro na geração Word:', err);
                    var errMsg = 'Erro ao gerar o ficheiro Word: ' + (err.message || err);
                    showMessage(errMsg, 'error');
                    alert(errMsg);
                });
        } catch (err) {
            console.error('[RC App] Erro síncrono na geração Word:', err);
            var errMsg = 'Erro inesperado ao gerar Word: ' + (err.message || err);
            showMessage(errMsg, 'error');
            alert(errMsg);
        }
    }

    function showStep(step) {
        state.currentStep = step;
        for (var i = 1; i <= 3; i++) {
            var el = document.getElementById('step' + i);
            if (el) el.style.display = i === step ? 'block' : 'none';
            var indicator = document.getElementById('stepIndicator' + i);
            if (indicator) { indicator.classList.toggle('active', i === step); indicator.classList.toggle('completed', i < step); }
        }
        // Scroll to top quando muda de passo
        window.scrollTo(0, 0);
    }
    function getVal(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function showMessage(msg, type) {
        var container = document.getElementById('messageContainer');
        if (!container) { console.warn('[RC App] messageContainer não encontrado'); return; }
        container.innerHTML = '<div class="rc-alert rc-alert-' + type + '">' + msg + '</div>';
        container.style.display = 'block';
        // Scroll para o topo para ver a mensagem
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (type === 'success' || type === 'info') setTimeout(function() { container.style.display = 'none'; }, 8000);
    }
    function showValidation(errors, warnings) {
        var container = document.getElementById('validationResults');
        if (!container) return;
        var html = '';
        errors.forEach(function(e) { html += '<div class="rc-alert rc-alert-error">' + e.mensagem + (e.detalhe ? '<br><small>' + e.detalhe + '</small>' : '') + '</div>'; });
        warnings.forEach(function(w) { html += '<div class="rc-alert rc-alert-warning">' + w.mensagem + '</div>'; });
        container.innerHTML = html;
        container.style.display = 'block';
    }
    function updateFileInfo(name, info) {
        var nameEl = document.getElementById('fileName'); var infoEl = document.getElementById('fileInfo');
        if (nameEl) nameEl.textContent = name; if (infoEl) infoEl.textContent = info;
        var container = document.getElementById('fileInfoContainer');
        if (container) container.style.display = name ? 'flex' : 'none';
    }
    function setupFormListeners() {
        ['empDenominacao','empNIF','empSede','empCAE','empCapitalSocial','empExercicio','empDataFecho','empNormativo','empContabilista','empExercicioComp'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() { saveToLocalStorage(); });
        });
    }
    function saveToLocalStorage(notas, relatorio) {
        try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ empresa: state.empresa, notas: notas || {}, relatorioGestao: relatorio || '' })); } catch (e) {}
    }
    function loadFromLocalStorage() {
        try {
            var saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!saved) return;
            var data = JSON.parse(saved);
            if (data.empresa) {
                var fields = { empDenominacao: data.empresa.denominacao, empNIF: data.empresa.nif, empSede: data.empresa.sede, empCAE: data.empresa.cae, empCapitalSocial: data.empresa.capital_social, empExercicio: data.empresa.exercicio, empDataFecho: data.empresa.data_fecho, empNormativo: data.empresa.normativo, empContabilista: data.empresa.contabilista, empExercicioComp: data.empresa.exercicio_comparativo };
                for (var id in fields) { var el = document.getElementById(id); if (el && fields[id]) el.value = fields[id]; }
            }
            if (data.notas) {
                var nf = ['notaDescricaoAtividade','notaEventosRelevantes','notaEventosPosBalanco','notaPassivosContingentes','notaPartesRelacionadas','notaHonorariosROC','notaOutrasInformacoes'];
                var nk = ['descricao_atividade','eventos_relevantes','eventos_pos_balanco','passivos_contingentes','partes_relacionadas','honorarios_roc','outras_informacoes'];
                nf.forEach(function(id, idx) { var el = document.getElementById(id); if (el && data.notas[nk[idx]]) el.value = data.notas[nk[idx]]; });
            }
            if (data.relatorioGestao) { var el = document.getElementById('relatorioGestao'); if (el) el.value = data.relatorioGestao; }
        } catch (e) {}
    }

    return { init: init, processarDados: processarDados, gerarWord: gerarWord, showStep: showStep, state: state };
})();

document.addEventListener('DOMContentLoaded', function() { RCApp.init(); });
