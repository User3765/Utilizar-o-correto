document.addEventListener('DOMContentLoaded', function() {
    const addItemButton = document.getElementById('add-item');
    const itemsTableBody = document.querySelector('#items-table tbody');
    const gerarNFButton = document.getElementById('gerar-nf');

    // Função para adicionar uma nova linha de item
    addItemButton.addEventListener('click', function() {
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><input type="text" name="descricao[]" required></td>
            <td><input type="number" name="precoUnitario[]" step="0.01" min="0" required></td>
            <td><input type="number" name="quantidade[]" min="1" required></td>
            <td><input type="number" name="somaTotal[]" step="0.01" min="0" readonly></td>
            <td><button type="button" class="remove-item">Remover</button></td>
        `;

        itemsTableBody.appendChild(newRow);
    });

    // Função para remover uma linha de item
    itemsTableBody.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-item')) {
            const row = e.target.closest('tr');
            row.remove();
            calculateTotal();
        }
    });

    // Função para calcular o total por item
    itemsTableBody.addEventListener('input', function(e) {
        const target = e.target;
        if (target.name === 'precoUnitario[]' || target.name === 'quantidade[]') {
            const row = target.closest('tr');
            const precoUnitario = parseFloat(row.querySelector('input[name="precoUnitario[]"]').value) || 0;
            const quantidade = parseFloat(row.querySelector('input[name="quantidade[]"]').value) || 0;
            const somaTotal = precoUnitario * quantidade;
            row.querySelector('input[name="somaTotal[]"]').value = somaTotal.toFixed(2);
            calculateTotal();
        }
    });

    // Função para calcular o total geral
    function calculateTotal() {
        const somaTotais = document.querySelectorAll('input[name="somaTotal[]"]');
        let totalGeral = 0;
        somaTotais.forEach(function(input) {
            totalGeral += parseFloat(input.value) || 0;
        });

        // Exibe o total no final da tabela
        let totalRow = document.getElementById('total-row');
        if (!totalRow) {
            totalRow = document.createElement('tr');
            totalRow.id = 'total-row';
            totalRow.innerHTML = `
                <td colspan="3" style="text-align: right;"><strong>Total Geral (R$):</strong></td>
                <td><strong>${totalGeral.toFixed(2)}</strong></td>
                <td></td>
            `;
            itemsTableBody.appendChild(totalRow);
        } else {
            totalRow.querySelector('td:nth-child(4) strong').textContent = totalGeral.toFixed(2);
        }
    }

    // Função para gerar a Nota Fiscal
    gerarNFButton.addEventListener('click', function() {
        // Coleta os dados do formulário
        const nomeCliente = document.getElementById('nomeCliente').value;
        const placaVeiculo = document.getElementById('placaVeiculo').value;
        const modeloVeiculo = document.getElementById('modeloVeiculo').value;
        const cpfCnpj = document.getElementById('cpfCnpj').value;
        const telefone = document.getElementById('telefone').value;
        const data = document.getElementById('data').value;
        const bairro = document.getElementById('bairro').value;
        const estado = document.getElementById('estado').value;
        const celular = document.getElementById('celular').value;
        const obs = document.getElementById('obs').value;

        // Coleta os itens
        const descricoes = Array.from(document.querySelectorAll('input[name="descricao[]"]')).map(input => input.value);
        const precosUnitarios = Array.from(document.querySelectorAll('input[name="precoUnitario[]"]')).map(input => parseFloat(input.value) || 0);
        const quantidades = Array.from(document.querySelectorAll('input[name="quantidade[]"]')).map(input => parseFloat(input.value) || 0);
        const somaTotais = Array.from(document.querySelectorAll('input[name="somaTotal[]"]')).map(input => parseFloat(input.value) || 0);

        // Validação simples
        if (!nomeCliente || !placaVeiculo || !modeloVeiculo || !cpfCnpj || !telefone || !data || !bairro || !estado || !celular) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Monta o array de itens
        const itens = [];
        for (let i = 0; i < descricoes.length; i++) {
            if (descricoes[i].trim() !== '') { // Ignora linhas vazias
                itens.push({
                    descricao: descricoes[i],
                    precoUnitario: precosUnitarios[i],
                    quantidade: quantidades[i],
                    somaTotal: somaTotais[i]
                });
            }
        }

        // Calcula o total geral
        const totalGeral = somaTotais.reduce((acc, curr) => acc + curr, 0);

        const dados = {
            nomeCliente,
            placaVeiculo,
            modeloVeiculo,
            cpfCnpj,
            telefone,
            data,
            bairro,
            estado,
            celular,
            obs,
            itens,
            totalGeral
        };

        // Envia os dados para o servidor
        fetch('/gerar-nf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success){
                const resultadoDiv = document.getElementById('resultado');
                resultadoDiv.innerHTML = `
                    <h2>Nota Fiscal Gerada com Sucesso!</h2>
                    <p>Total Geral: R$ ${totalGeral.toFixed(2)}</p>
                    <a href="${data.url}" target="_blank">Baixar Nota Fiscal</a>
                `;
            } else {
                alert('Erro ao gerar a Nota Fiscal.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao gerar a Nota Fiscal.');
        });
    });
});
