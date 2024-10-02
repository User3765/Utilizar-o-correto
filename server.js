const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Rota para gerar a Nota Fiscal
app.post('/gerar-nf', (req, res) => {
    const {
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
    } = req.body;

    // Criação do documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const timestamp = Date.now();
    const fileName = `nota-fiscal-${timestamp}.pdf`;
    const filePath = path.join(__dirname, 'public', fileName);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Cabeçalho com logotipo e informações da empresa
    const logoPath = path.join(__dirname, 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 100 });
    }

    doc
        .fontSize(20)
        .text('Connectcar Mecânica Automotiva', 170, 50)
        .fontSize(10)
        .text('Rua Rio dos Anjos - Içara - SC', 170, 75)
        .text('Fone: (48) 9830-9237 / (48) 9967-0530', 170, 90)
        .text('Email: connectar.automotiva@gmail.com', 170, 105)
        .moveDown();

    // Informações do Cliente com ajuste nas coordenadas
    doc
        .fontSize(12)
        // Coluna da Esquerda
        .text(`Nome do Cliente: ${nomeCliente}`, 50, 150)
        .text(`Placa do Veículo: ${placaVeiculo}`, 50, 165)
        .text(`Modelo do Veículo: ${modeloVeiculo}`, 50, 180)

        // Coluna do Meio (Ajustada para x=250)
        .text(`CPF/CNPJ: ${cpfCnpj}`, 250, 150)
        .text(`Telefone: ${telefone}`, 250, 165)
        .text(`Data: ${data}`, 250, 180)

        // Coluna da Direita (Ajustada para x=400)
        .text(`Bairro: ${bairro}`, 400, 150)
        .text(`Estado: ${estado}`, 400, 165)
        .text(`Celular: ${celular}`, 400, 180)
        .text(`Observações: ${obs}`, 400, 195)
        .moveDown();

    // Espaço antes da tabela
    doc.moveDown();

    // Tabela de Itens
    const tableTop = 220;
    const itemX = 50;
    const precoX = 250;
    const quantidadeX = 350;
    const somaTotalX = 450;

    // Cabeçalhos da tabela
    doc
        .fontSize(12)
        .text('Descrição do Produto', itemX, tableTop, { bold: true })
        .text('Preço Unitário (R$)', precoX, tableTop)
        .text('Quantidade', quantidadeX, tableTop)
        .text('Soma Total (R$)', somaTotalX, tableTop);

    // Linha de separação
    doc.moveTo(itemX, tableTop + 15)
       .lineTo(somaTotalX + 100, tableTop + 15) // Ajuste para cobrir toda a largura da tabela
       .stroke();

    // Itens
    let positionY = tableTop + 25;
    itens.forEach((item, index) => {
        doc
            .fontSize(10)
            .text(item.descricao, itemX, positionY, { width: 180, align: 'left', lineBreak: true })
            .text(`R$ ${item.precoUnitario.toFixed(2)}`, precoX, positionY, { width: 80, align: 'right' })
            .text(item.quantidade, quantidadeX, positionY, { width: 80, align: 'right' })
            .text(`R$ ${item.somaTotal.toFixed(2)}`, somaTotalX, positionY, { width: 80, align: 'right' });
        positionY += 20;

        // Limitar a altura da página e adicionar uma nova página se necessário
        if (positionY > 750) { // Valor aproximado para evitar overflow
            doc.addPage();
            positionY = 50;

            // Reescrever os cabeçalhos na nova página
            doc
                .fontSize(12)
                .text('Descrição do Produto', itemX, 50, { bold: true })
                .text('Preço Unitário (R$)', precoX, 50)
                .text('Quantidade', quantidadeX, 50)
                .text('Soma Total (R$)', somaTotalX, 50);

            // Linha de separação na nova página
            doc.moveTo(itemX, 65)
               .lineTo(somaTotalX + 100, 65)
               .stroke();
        }
    });

// Linha antes do total
doc.moveTo(itemX, positionY)
   .lineTo(somaTotalX + 100, positionY)
   .stroke();

// Total Geral Ajustado
doc
    .fontSize(12)
    .text('Total Geral:', quantidadeX, positionY + 10, { align: 'right' });

// Ajuste a posição vertical para o valor
positionY += 20; // Ajuste conforme necessário para evitar sobreposição

doc
    .fontSize(12)
    .text(`R$ ${totalGeral.toFixed(2)}`, somaTotalX, positionY, { align: 'right' });


    // Finaliza o PDF
    doc.end();

    stream.on('finish', () => {
        res.json({ success: true, url: `/${fileName}` });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
