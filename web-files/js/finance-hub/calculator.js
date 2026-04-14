/**
 * calculator.js
 * Módulo de cálculo de indicadores financeiros
 * Calcula rácios e indicadores a partir dos valores das demonstrações financeiras
 */
var Calculator = (function() {
    'use strict';
    function calcularIndicadores(balanco, dr) {
        var ativoTotal = balanco.ativo_total;
        var ativoCorrente = balanco.ativo_corrente.total;
        var capitalProprio = balanco.capital_proprio.total;
        var passivoTotal = balanco.passivo_total;
        var passivoCorrente = balanco.passivo_corrente.total;
        var inventarios = SNCMapper.getValorRubrica(balanco, 'INV');
        var clientes = SNCMapper.getValorRubrica(balanco, 'CLI');
        var fornecedores = SNCMapper.getValorRubrica(balanco, 'PC_FORN');
        var vn = dr.valores.VN || 0;
        var cmvmc = dr.valores.CMVMC || 0;
        var fse = dr.valores.FSE || 0;
        var rl = dr.subtotais.RL;
        var ebit = dr.subtotais.EBIT;
        var ebitda = dr.subtotais.EBITDA;
        var vnIVA = vn * 1.23;
        var comprasIVA = (cmvmc + fse) * 1.23;
        return [
            { id: 'AUT_FIN', nome: 'Autonomia Financeira', valor: safeDivide(capitalProprio, ativoTotal), formato: 'percentagem', descricao: 'Capital Próprio / Ativo Total' },
            { id: 'SOLV', nome: 'Solvabilidade', valor: safeDivide(capitalProprio, passivoTotal), formato: 'percentagem', descricao: 'Capital Próprio / Passivo Total' },
            { id: 'LIQ_G', nome: 'Liquidez Geral', valor: safeDivide(ativoCorrente, passivoCorrente), formato: 'racio', descricao: 'Ativo Corrente / Passivo Corrente' },
            { id: 'LIQ_R', nome: 'Liquidez Reduzida', valor: safeDivide(ativoCorrente - inventarios, passivoCorrente), formato: 'racio', descricao: '(Ativo Corrente - Inventários) / Passivo Corrente' },
            { id: 'EBITDA_IND', nome: 'EBITDA', valor: ebitda, formato: 'valor', descricao: 'Resultado antes de juros, impostos, depreciações e amortizações' },
            { id: 'MARG_EBITDA', nome: 'Margem EBITDA', valor: safeDivide(ebitda, vn), formato: 'percentagem', descricao: 'EBITDA / Volume de Negócios' },
            { id: 'MARG_LIQ', nome: 'Margem Líquida', valor: safeDivide(rl, vn), formato: 'percentagem', descricao: 'Resultado Líquido / Volume de Negócios' },
            { id: 'ROE', nome: 'ROE', valor: safeDivide(rl, capitalProprio), formato: 'percentagem', descricao: 'Resultado Líquido / Capital Próprio' },
            { id: 'ROA', nome: 'ROA', valor: safeDivide(ebit, ativoTotal), formato: 'percentagem', descricao: 'EBIT / Ativo Total' },
            { id: 'PMR', nome: 'Prazo Médio de Recebimentos', valor: vnIVA > 0 ? (clientes / vnIVA) * 365 : null, formato: 'dias', descricao: '(Clientes / VN c/ IVA) × 365' },
            { id: 'PMP', nome: 'Prazo Médio de Pagamentos', valor: comprasIVA > 0 ? (fornecedores / comprasIVA) * 365 : null, formato: 'dias', descricao: '(Fornecedores / Compras c/ IVA) × 365' },
            { id: 'FM', nome: 'Fundo de Maneio', valor: ativoCorrente - passivoCorrente, formato: 'valor', descricao: 'Ativo Corrente - Passivo Corrente' }
        ];
    }
    function safeDivide(num, den) { if (!den || den === 0) return null; return num / den; }
    function formatarIndicador(indicador) {
        if (indicador.valor === null || indicador.valor === undefined) return 'N/A';
        switch (indicador.formato) {
            case 'percentagem': return formatPT(indicador.valor * 100, 1) + '%';
            case 'racio': return formatPT(indicador.valor, 2);
            case 'dias': return Math.round(indicador.valor) + ' dias';
            case 'valor': return formatPT(indicador.valor, 0) + ' €';
            default: return formatPT(indicador.valor, 2);
        }
    }
    function formatPT(valor, decimais) {
        if (valor === null || valor === undefined || isNaN(valor)) return 'N/A';
        decimais = decimais !== undefined ? decimais : 2;
        var isNeg = valor < 0;
        var abs = Math.abs(valor);
        var parts = abs.toFixed(decimais).split('.');
        var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        var result = decimais > 0 ? intPart + ',' + parts[1] : intPart;
        if (isNeg) result = '(' + result + ')';
        return result;
    }
    function verificarConsistencia(balanco, dr, dfc) {
        var avisos = [];
        var diffBalanco = Math.abs(balanco.ativo_total - balanco.cp_passivo_total);
        if (diffBalanco > 1) {
            avisos.push({ tipo: 'erro', mensagem: 'Balanço desequilibrado: Ativo (' + formatPT(balanco.ativo_total, 2) + '€) ≠ Passivo + CP (' + formatPT(balanco.cp_passivo_total, 2) + '€). Diferença: ' + formatPT(diffBalanco, 2) + '€' });
        }
        if (dfc) {
            var totalFluxos = dfc.operacionais.total + dfc.investimento.total + dfc.financiamento.total;
            var diffDFC = Math.abs(totalFluxos - dfc.variacao_caixa);
            if (diffDFC > 1) {
                avisos.push({ tipo: 'aviso', mensagem: 'DFC: Total dos fluxos (' + formatPT(totalFluxos, 2) + '€) ≠ Variação de caixa (' + formatPT(dfc.variacao_caixa, 2) + '€). Diferença: ' + formatPT(diffDFC, 2) + '€' });
            }
        }
        return avisos;
    }
    return { calcularIndicadores: calcularIndicadores, formatarIndicador: formatarIndicador, formatPT: formatPT, verificarConsistencia: verificarConsistencia, safeDivide: safeDivide };
})();
