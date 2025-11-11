let myChart;

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Lógica do Simulador de Investimentos
function calculateInvestment() {
    const initialInvestment = parseFloat(document.getElementById('initialInvestment').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const annualReturn = (parseFloat(document.getElementById('annualReturn').value) || 0) / 100;
    const goal = parseFloat(document.getElementById('goal').value) || 0;
    
    if (goal === 0) {
        document.getElementById('investmentResult').innerHTML = `<p style="color: red;">Por favor, defina um Objetivo Financeiro maior que zero.</p>`;
        return;
    }

    const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
    let balance = initialInvestment;
    let months = 0;
    let totalInvested = initialInvestment;
    const labels = [];
    const data = [];

    while (balance < goal && months < 1200) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
        totalInvested += monthlyContribution;
        months++;
        labels.push(months);
        data.push(balance);
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    document.getElementById('investmentResult').innerHTML = `
        <p>Objetivo de ${formatCurrency(goal)} alcançado em <strong>${years} anos e ${remainingMonths} meses</strong>.</p>
        <p>Valor total investido: <strong>${formatCurrency(totalInvested)}</strong></p>
        <p>Total em juros: <strong>${formatCurrency(balance - totalInvested)}</strong></p>
    `;

    if (myChart) myChart.destroy();

    const ctx = document.getElementById('investmentChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Patrimônio Acumulado',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Meses' } },
                y: { title: { display: true, text: 'Valor (R$)' } }
            }
        }
    });
}

// Lógica da Calculadora Financeira HP 12C
function calculateRate(n, pmt, pv, fv) {
    const maxIterations = 50;
    const precision = 1e-7;
    let rate = 0.1;

    for (let i = 0; i < maxIterations; i++) {
        if (Math.abs(rate) < 1e-9) rate = 1e-9;
        const f = pv * Math.pow(1 + rate, n) + pmt * (Math.pow(1 + rate, n) - 1) / rate + fv;
        const f_prime = n * pv * Math.pow(1 + rate, n - 1) + pmt * (n * rate * Math.pow(1 + rate, n - 1) - (Math.pow(1 + rate, n) - 1)) / Math.pow(rate, 2);
        const newRate = rate - f / f_prime;

        if (Math.abs(newRate - rate) < precision) return newRate;
        rate = newRate;
    }
    return null;
}

function calculateHP() {
    const toCalculate = document.getElementById('calculateSelect').value;
    let n = parseInt(document.getElementById('hp_n').value) || 0;
    let i = (parseFloat(document.getElementById('hp_i').value) || 0) / 100;
    let pv = parseFloat(document.getElementById('hp_pv').value) || 0;
    let pmt = parseFloat(document.getElementById('hp_pmt').value) || 0;
    let fv = parseFloat(document.getElementById('hp_fv').value) || 0;
    let result = '';

    try {
        switch (toCalculate) {
            case 'n': {
                let rawN;
                if (i > 0) {
                    let numerator = Math.log((pmt - fv * i) / (pmt + pv * i));
                    let denominator = Math.log(1 + i);
                    rawN = Math.ceil(numerator / denominator);
                } else {
                    rawN = Math.round(-(pv + fv) / pmt);
                }
                result = `n = ${rawN} meses`;
                document.getElementById('hp_n').value = rawN;
                break;
            }
            case 'i': {
                const calculatedRate = calculateRate(n, -pmt, -pv, fv);
                if (calculatedRate !== null) {
                    const ratePercent = calculatedRate * 100;
                    result = `i = ${ratePercent.toFixed(4)}% a.m.`;
                    document.getElementById('hp_i').value = ratePercent.toFixed(4);
                } else {
                    result = "Não foi possível convergir para uma taxa.";
                }
                break;
            }
            case 'pv': {
                let rawPV;
                if (i > 0) {
                    rawPV = (pmt * (1 - Math.pow(1 + i, -n))) / i + fv / Math.pow(1 + i, n);
                } else {
                    rawPV = -(fv + pmt * n);
                }
                rawPV = -rawPV;
                result = `PV = ${formatCurrency(rawPV)}`;
                document.getElementById('hp_pv').value = rawPV.toFixed(2);
                break;
            }
            case 'pmt': {
                let rawPMT;
                if (i > 0) {
                    rawPMT = (pv * i * Math.pow(1 + i, n) + fv * i) / (Math.pow(1 + i, n) - 1);
                } else {
                    rawPMT = -(pv + fv) / n;
                }
                rawPMT = -rawPMT;
                result = `PMT = ${formatCurrency(rawPMT)}`;
                document.getElementById('hp_pmt').value = rawPMT.toFixed(2);
                break;
            }
            case 'fv': {
                let rawFV;
                if (i > 0) {
                    rawFV = pv * Math.pow(1 + i, n) + pmt * ((Math.pow(1 + i, n) - 1) / i);
                } else {
                    rawFV = -(pv + pmt * n);
                }
                rawFV = -rawFV;
                result = `FV = ${formatCurrency(rawFV)}`;
                document.getElementById('hp_fv').value = rawFV.toFixed(2);
                break;
            }
        }
        document.getElementById('hpResult').innerHTML = `<p><strong>Resultado: ${result}</strong></p>`;
    } catch (error) {
        document.getElementById('hpResult').innerHTML = `<p style="color: red;">Erro no cálculo. Verifique os valores inseridos.</p>`;
    }
}

// Lógica das Tabelas de Amortização
function generatePriceTable() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const monthlyInterestRate = (parseFloat(document.getElementById('monthlyInterestRate').value) || 0) / 100;
    const loanTerm = parseInt(document.getElementById('loanTerm').value) || 0;
    const loanFv = parseFloat(document.getElementById('loanFv').value) || 0;

    if (loanTerm <= 0 || loanAmount <= 0) return;

    let pmt = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm) - loanFv * monthlyInterestRate) / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
    pmt = parseFloat(pmt.toFixed(2));

    let tableRows = '';
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPaid = 0;

    for (let i = 1; i <= loanTerm; i++) {
        let interest = balance * monthlyInterestRate;
        let amortization;
        let currentPmt = pmt;

        if (i === loanTerm) {
            amortization = balance - loanFv;
            currentPmt = amortization + interest;
            balance = loanFv;
        } else {
            amortization = currentPmt - interest;
            balance -= amortization;
        }
        
        totalInterest += interest;
        totalPaid += currentPmt;

        tableRows += `<tr><td>${i}</td><td>${formatCurrency(currentPmt)}</td><td>${formatCurrency(interest)}</td><td>${formatCurrency(amortization)}</td><td>${formatCurrency(balance)}</td></tr>`;
    }

    const totalAmortized = loanAmount - loanFv;

    let tableHTML = `
        <h3>Tabela PRICE</h3>
        <div class="summary">
            <p><strong>Total Amortizado:</strong> ${formatCurrency(totalAmortized)}</p>
            <p><strong>Total de Juros:</strong> ${formatCurrency(totalInterest)}</p>
            <p><strong>Total de Pagamentos:</strong> ${formatCurrency(totalPaid)}</p>
        </div>
        <table>
            <tr><th>Mês</th><th>Prestação</th><th>Juros</th><th>Amortização</th><th>Saldo Devedor</th></tr>
            ${tableRows}
        </table>`;
    document.getElementById('amortizationTable').innerHTML = tableHTML;
}

function generateSacTable() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const monthlyInterestRate = (parseFloat(document.getElementById('monthlyInterestRate').value) || 0) / 100;
    const loanTerm = parseInt(document.getElementById('loanTerm').value) || 0;
    const loanFv = parseFloat(document.getElementById('loanFv').value) || 0;

    if (loanTerm <= 0 || loanAmount <= 0) return;

    let baseAmortization = (loanAmount - loanFv) / loanTerm;
    baseAmortization = parseFloat(baseAmortization.toFixed(2));
    
    let tableRows = '';
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPaid = 0;

    for (let i = 1; i <= loanTerm; i++) {
        let interest = balance * monthlyInterestRate;
        let amortization = baseAmortization;

        if (i === loanTerm) {
            amortization = balance - loanFv;
        }
        
        const currentPmt = amortization + interest;
        balance -= amortization;
        
        totalInterest += interest;
        totalPaid += currentPmt;

        tableRows += `<tr><td>${i}</td><td>${formatCurrency(currentPmt)}</td><td>${formatCurrency(interest)}</td><td>${formatCurrency(amortization)}</td><td>${formatCurrency(balance)}</td></tr>`;
    }

    const totalAmortized = loanAmount - loanFv;

    let tableHTML = `
        <h3>Tabela SAC</h3>
        <div class="summary">
            <p><strong>Total Amortizado:</strong> ${formatCurrency(totalAmortized)}</p>
            <p><strong>Total de Juros:</strong> ${formatCurrency(totalInterest)}</p>
            <p><strong>Total de Pagamentos:</strong> ${formatCurrency(totalPaid)}</p>
        </div>
        <table>
            <tr><th>Mês</th><th>Prestação</th><th>Juros</th><th>Amortização</th><th>Saldo Devedor</th></tr>
            ${tableRows}
        </table>`;

    document.getElementById('amortizationTable').innerHTML = tableHTML;
}
// ===================================================================
// INICIALIZAÇÃO AUTOMÁTICA AO CARREGAR A PÁGINA
// ===================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Chama a função de cálculo do investimento uma vez
    // para que o gráfico já apareça preenchido na tela inicial.
    calculateInvestment();
});