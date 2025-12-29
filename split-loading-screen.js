/**
 * Script para dividir uma imagem editada de volta em múltiplos OZJ
 * Uso: node split-loading-screen.js <imagem.png> <layout.json> <pasta-saida>
 * 
 * Exemplo: node split-loading-screen.js lo_back_s5_im_COMPLETO.png lo_back_s5_im_COMPLETO_layout.json output
 */

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Função para codificar JPEG em OZJ
function encodeOZJ(jpegBuffer) {
  const data = new Uint8Array(jpegBuffer);
  
  // XOR simples (chave: 0xFC)
  const encoded = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encoded[i] = data[i] ^ 0xFC;
  }
  
  return Buffer.from(encoded);
}

async function splitImage(imagePath, layoutPath, outputFolder) {
  console.log('\n========================================');
  console.log('DIVISOR DE LOADING SCREEN - MU ONLINE');
  console.log('========================================\n');
  console.log('Imagem:', imagePath);
  console.log('Layout:', layoutPath);
  console.log('Saida:', outputFolder);
  console.log('----------------------------------------\n');

  // Lê informações de layout
  if (!fs.existsSync(layoutPath)) {
    console.error('[ERRO] Arquivo de layout nao encontrado!');
    console.error('   Use o merge-loading-screen.js primeiro para gerar o layout.');
    process.exit(1);
  }

  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  console.log('Informacoes do layout:');
  console.log(`   Grid: ${layout.cols}x${layout.rows} (${layout.totalPieces} pecas)`);
  console.log(`   Tamanho de cada peca: ${layout.pieceWidth}x${layout.pieceHeight}px`);

  // Cria pasta de saída
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Carrega imagem editada
  console.log('\nCarregando imagem editada...');
  const img = await Jimp.read(imagePath);
  
  if (img.getWidth() !== layout.finalWidth || img.getHeight() !== layout.finalHeight) {
    console.warn('[AVISO] Dimensoes diferentes do original!');
    console.warn(`   Original: ${layout.finalWidth}x${layout.finalHeight}px`);
    console.warn(`   Atual: ${img.getWidth()}x${img.getHeight()}px`);
    console.warn('   Continuando mesmo assim...');
  }

  console.log('\nDividindo imagem em pecas...');
  
  for (let i = 0; i < layout.totalPieces; i++) {
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    const x = col * layout.pieceWidth;
    const y = row * layout.pieceHeight;

    // Extrai a peça
    const piece = img.clone().crop(x, y, layout.pieceWidth, layout.pieceHeight);

    // Salva como JPEG em buffer
    const jpegBuffer = await piece.quality(95).getBufferAsync(Jimp.MIME_JPEG);

    // Converte JPEG -> OZJ
    const ozjBuffer = encodeOZJ(jpegBuffer);
    const originalName = layout.originalFiles[i];
    const ozjPath = path.join(outputFolder, originalName);
    fs.writeFileSync(ozjPath, ozjBuffer);

    console.log(`   [OK] Peca ${i + 1}/${layout.totalPieces}: ${originalName}`);
  }

  console.log('\n----------------------------------------');
  console.log('CONCLUIDO\n');
  console.log(`Arquivos OZJ salvos em: ${outputFolder}`);
  console.log(`Total de arquivos: ${layout.totalPieces}`);
  console.log('\nProximos passos:');
  console.log('   1. Copie os arquivos OZJ para a pasta do MU Online');
  console.log('   2. Substitua os arquivos originais');
  console.log('   3. Teste no jogo!');
  console.log('========================================\n');
}

// Execução
const imagePath = process.argv[2];
const layoutPath = process.argv[3];
const outputFolder = process.argv[4] || 'output-loading';

if (!imagePath || !layoutPath) {
  console.log('Uso: node split-loading-screen.js <imagem.png> <layout.json> [pasta-saida]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node split-loading-screen.js lo_back_s5_im_COMPLETO.png lo_back_s5_im_COMPLETO_layout.json output');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`[ERRO] Imagem nao encontrada: ${imagePath}`);
  process.exit(1);
}

splitImage(imagePath, layoutPath, outputFolder).catch(err => {
  console.error('\n[ERRO]:', err.message);
  console.error(err.stack);
  process.exit(1);
});
