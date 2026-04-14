/**
 * snc-mapper.js
 * Motor de mapeamento SNC - transforma saldos do balancete em rubricas das demonstrações financeiras
 * Utiliza o ficheiro mapping-ncrf.json como configuração central
 */
var SNCMapper = (function() {
    'use strict';
    var mapping = null;
    var balancete = [];
    var contasMaxNivel = [];

    function loadMapping(url) {
        return fetch(url).then(function(response) {
            if (!response.ok) throw new Error('Erro ao carregar mapeamento SNC: ' + response.status);
            return response.json();
        }).then(function(data) { mapping = data; return data; });
    }
    function setMapping(data) { mapping = data; }
    function setBalancete(data) { balancete = data; contasMaxNivel = ExcelReader.getContasMaxNivel(data); }

    function somaDevedores(prefixos, periodo) {
        if (!prefixos || prefixos.length === 0) return 0;
        var total = 0;
        var campo_dev = periodo === 'anterior' ? 'ano_ant_devedor' : 'saldo_dev_fin';
        contasMaxNivel.forEach(function(entry) {
            for (var i = 0; i < prefixos.length; i++) { if (entry.conta.indexOf(prefixos[i]) === 0) { total += (entry[campo_dev] || 0); break; } }
        });
        return total;
    }
    function somaCredores(prefixos, periodo) {
        if (!prefixos || prefixos.length === 0) return 0;
        var total = 0;
        var campo_cred = periodo === 'anterior' ? 'ano_ant_credor' : 'saldo_cred_fin';
        contasMaxNivel.forEach(function(entry) {
            for (var i = 0; i < prefixos.length; i++) { if (entry.conta.indexOf(prefixos[i]) === 0) { total += (entry[campo_cred] || 0); break; } }
        });
        return total;
    }
    function saldoLiquido(prefixos, periodo) {
        if (!prefixos || prefixos.length === 0) return 0;
        var totalDev = 0, totalCred = 0;
        var campo_dev = periodo === 'anterior' ? 'ano_ant_devedor' : 'saldo_dev_fin';
        var campo_cred = periodo === 'anterior' ? 'ano_ant_credor' : 'saldo_cred_fin';
        contasMaxNivel.forEach(function(entry) {
            for (var i = 0; i < prefixos.length; i++) { if (entry.conta.indexOf(prefixos[i]) === 0) { totalDev += (entry[campo_dev] || 0); totalCred += (entry[campo_cred] || 0); break; } }
        });
        return totalDev - totalCred;
    }

    function calcularRubricaBalanco(rubrica, periodo) {
        if (rubrica.tipo === 'calculado') return null;
        var valor = 0;
        if (rubrica.contas_debito) valor += somaDevedores(rubrica.contas_debito, periodo);
        if (rubrica.contas_credito) valor += somaCredores(rubrica.contas_credito, periodo);
        if (rubrica.contas_subtrair) { valor -= somaCredores(rubrica.contas_subtrair, periodo); valor -= somaDevedores(rubrica.contas_subtrair, periodo); }
        if (rubrica.contas_debito_negativo) valor -= somaDevedores(rubrica.contas_debito_negativo, periodo);
        if (rubrica.tipo === 'liquido') { if (rubrica.contas_credito) valor = saldoLiquido(rubrica.contas_credito, periodo) * -1; }
        return Math.round(valor * 100) / 100;
    }

    function calcularRubricaDR(rubrica, periodo) {
        var valor = 0;
        if (rubrica.tipo === 'rendimento') { valor = somaCredores(rubrica.contas_credito, periodo); }
        else if (rubrica.tipo === 'gasto') { valor = somaDevedores(rubrica.contas_debito, periodo); }
        else if (rubrica.tipo === 'gasto_liquido') { var gastos = rubrica.contas_debito ? somaDevedores(rubrica.contas_debito, periodo) : 0; var reversoes = rubrica.contas_credito_reverter ? somaCredores(rubrica.contas_credito_reverter, periodo) : 0; valor = gastos - reversoes; }
        else if (rubrica.tipo === 'liquido') { var creditos = rubrica.contas_credito ? somaCredores(rubrica.contas_credito, periodo) : 0; var debitos = rubrica.contas_debito ? somaDevedores(rubrica.contas_debito, periodo) : 0; valor = creditos - debitos; }
        return Math.round(valor * 100) / 100;
    }

    function processarBalanco(periodo) {
        if (!mapping) throw new Error('Mapeamento não carregado');
        var resultado = { ativo_nao_corrente: { rubricas: [], total: 0 }, ativo_corrente: { rubricas: [], total: 0 }, ativo_total: 0, capital_proprio: { rubricas: [], total: 0 }, passivo_nao_corrente: { rubricas: [], total: 0 }, passivo_corrente: { rubricas: [], total: 0 }, passivo_total: 0, cp_passivo_total: 0 };
        ['ativo_nao_corrente', 'ativo_corrente', 'capital_proprio', 'passivo_nao_corrente', 'passivo_corrente'].forEach(function(seccao) {
            var rubricas = mapping.balanco[seccao];
            if (!rubricas) return;
            rubricas.forEach(function(rubrica) {
                var valor = calcularRubricaBalanco(rubrica, periodo);
                resultado[seccao].rubricas.push({ id: rubrica.id, nome: rubrica.nome, valor: valor, tipo: rubrica.tipo });
                if (valor !== null) resultado[seccao].total += valor;
            });
        });
        resultado.ativo_total = resultado.ativo_nao_corrente.total + resultado.ativo_corrente.total;
        resultado.passivo_total = resultado.passivo_nao_corrente.total + resultado.passivo_corrente.total;
        resultado.cp_passivo_total = resultado.capital_proprio.total + resultado.passivo_total;
        return resultado;
    }

    function processarDR(periodo) {
        if (!mapping) throw new Error('Mapeamento não carregado');
        var resultado = { rubricas: [], subtotais: {} };
        var valores = {};
        mapping.demonstracao_resultados.forEach(function(rubrica) {
            var valor = calcularRubricaDR(rubrica, periodo);
            valores[rubrica.id] = valor;
            resultado.rubricas.push({ id: rubrica.id, nome: rubrica.nome, valor: valor, tipo: rubrica.tipo });
        });
        var ebitda = (valores.VN||0)+(valores.SUB_EXP||0)+(valores.GINV||0)+(valores.VINV||0)+(valores.TPE||0)-(valores.CMVMC||0)-(valores.FSE||0)-(valores.GP||0)-(valores.IMP_PR||0)-(valores.IMP_DA||0)-(valores.PROV||0)+(valores.ORI||0)-(valores.OGP||0);
        var ebit = ebitda - (valores.DA||0) - (valores.IMP_INV||0);
        var rai = ebit + (valores.JRO||0) - (valores.JGS||0);
        var rl = rai - (valores.IRC||0);
        resultado.subtotais = { EBITDA: Math.round(ebitda*100)/100, EBIT: Math.round(ebit*100)/100, RAI: Math.round(rai*100)/100, RL: Math.round(rl*100)/100 };
        resultado.valores = valores;
        return resultado;
    }

    function processarDACP() {
        if (!mapping) throw new Error('Mapeamento não carregado');
        var resultado = [];
        mapping.balanco.capital_proprio.forEach(function(rubrica) {
            if (rubrica.tipo === 'calculado') return;
            var saldoIni = 0, saldoFin = 0;
            if (rubrica.contas_credito) { rubrica.contas_credito.forEach(function(prefix) { contasMaxNivel.forEach(function(entry) { if (entry.conta.indexOf(prefix) === 0) { saldoIni += (entry.saldo_cred_ini||0) - (entry.saldo_dev_ini||0); saldoFin += (entry.saldo_cred_fin||0) - (entry.saldo_dev_fin||0); } }); }); }
            resultado.push({ id: rubrica.id, nome: rubrica.nome, saldo_inicial: Math.round(saldoIni*100)/100, movimentos: Math.round((saldoFin-saldoIni)*100)/100, saldo_final: Math.round(saldoFin*100)/100 });
        });
        return resultado;
    }

    function processarDFC(drResult, balancoAtual, balancoAnterior) {
        if (!mapping) throw new Error('Mapeamento não carregado');
        var resultado = { operacionais: { itens: [], total: 0 }, investimento: { itens: [], total: 0 }, financiamento: { itens: [], total: 0 }, variacao_caixa: 0, caixa_inicio: 0, caixa_fim: 0 };
        var rl = drResult.subtotais.RL;
        resultado.operacionais.itens.push({ nome: 'Resultado líquido do período', valor: rl });
        var da = drResult.valores.DA || 0;
        resultado.operacionais.itens.push({ nome: 'Depreciações e amortizações', valor: da });
        var imp = (drResult.valores.IMP_PR||0)+(drResult.valores.IMP_DA||0)+(drResult.valores.IMP_INV||0);
        resultado.operacionais.itens.push({ nome: 'Imparidades (perdas/reversões)', valor: imp });
        var prov = drResult.valores.PROV || 0;
        resultado.operacionais.itens.push({ nome: 'Provisões (aumentos/reduções)', valor: prov });
        if (balancoAnterior) {
            var varInv = getValorRubrica(balancoAnterior,'INV') - getValorRubrica(balancoAtual,'INV');
            resultado.operacionais.itens.push({ nome: 'Variação de inventários', valor: varInv });
            var varCli = getValorRubrica(balancoAnterior,'CLI') - getValorRubrica(balancoAtual,'CLI');
            resultado.operacionais.itens.push({ nome: 'Variação de clientes', valor: varCli });
            var varForn = getValorRubrica(balancoAtual,'PC_FORN') - getValorRubrica(balancoAnterior,'PC_FORN');
            resultado.operacionais.itens.push({ nome: 'Variação de fornecedores', valor: varForn });
            var varEOEP = (getValorRubrica(balancoAtual,'PC_EOEP')-getValorRubrica(balancoAnterior,'PC_EOEP'))-(getValorRubrica(balancoAtual,'EOEP_A')-getValorRubrica(balancoAnterior,'EOEP_A'));
            resultado.operacionais.itens.push({ nome: 'Variação de Estado e outros entes públicos', valor: varEOEP });
            var varOCC = (getValorRubrica(balancoAtual,'PC_OCP')-getValorRubrica(balancoAnterior,'PC_OCP'))-(getValorRubrica(balancoAtual,'OAR')-getValorRubrica(balancoAnterior,'OAR'));
            resultado.operacionais.itens.push({ nome: 'Outras variações do capital circulante', valor: varOCC });
            resultado.operacionais.total = rl+da+imp+prov+varInv+varCli+varForn+varEOEP+varOCC;
        } else { resultado.operacionais.total = rl+da+imp+prov; }
        if (balancoAnterior) {
            var varAFT = getValorRubrica(balancoAnterior,'AFT')-getValorRubrica(balancoAtual,'AFT')-da;
            resultado.investimento.itens.push({ nome: 'Ativos fixos tangíveis', valor: Math.round(varAFT*100)/100 });
            var varAI = getValorRubrica(balancoAnterior,'AI')-getValorRubrica(balancoAtual,'AI');
            resultado.investimento.itens.push({ nome: 'Ativos intangíveis', valor: Math.round(varAI*100)/100 });
            var varIF = getValorRubrica(balancoAnterior,'IF')-getValorRubrica(balancoAtual,'IF');
            resultado.investimento.itens.push({ nome: 'Investimentos financeiros', valor: Math.round(varIF*100)/100 });
            resultado.investimento.total = Math.round((varAFT+varAI+varIF)*100)/100;
        }
        if (balancoAnterior) {
            var varFin = (getValorRubrica(balancoAtual,'PNC_FIN')+getValorRubrica(balancoAtual,'PC_FIN'))-(getValorRubrica(balancoAnterior,'PNC_FIN')+getValorRubrica(balancoAnterior,'PC_FIN'));
            resultado.financiamento.itens.push({ nome: 'Financiamentos obtidos', valor: Math.round(varFin*100)/100 });
            var varCap = getValorRubrica(balancoAtual,'CR')-getValorRubrica(balancoAnterior,'CR');
            resultado.financiamento.itens.push({ nome: 'Realizações de capital', valor: Math.round(varCap*100)/100 });
            resultado.financiamento.total = Math.round((varFin+varCap)*100)/100;
        }
        resultado.caixa_fim = getValorRubrica(balancoAtual, 'CAIXA');
        resultado.caixa_inicio = balancoAnterior ? getValorRubrica(balancoAnterior, 'CAIXA') : 0;
        resultado.variacao_caixa = Math.round((resultado.caixa_fim - resultado.caixa_inicio)*100)/100;
        resultado.operacionais.total = Math.round(resultado.operacionais.total*100)/100;
        return resultado;
    }

    function getValorRubrica(balanco, id) {
        var seccoes = ['ativo_nao_corrente','ativo_corrente','capital_proprio','passivo_nao_corrente','passivo_corrente'];
        for (var s = 0; s < seccoes.length; s++) { var rubricas = balanco[seccoes[s]].rubricas; for (var r = 0; r < rubricas.length; r++) { if (rubricas[r].id === id) return rubricas[r].valor || 0; } }
        return 0;
    }

    return { loadMapping: loadMapping, setMapping: setMapping, setBalancete: setBalancete, processarBalanco: processarBalanco, processarDR: processarDR, processarDACP: processarDACP, processarDFC: processarDFC, getValorRubrica: getValorRubrica, somaDevedores: somaDevedores, somaCredores: somaCredores, saldoLiquido: saldoLiquido };
})();
