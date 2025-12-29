/**
 * Script para juntar múltiplos arquivos OZJ em uma única imagem
 * Uso: node merge-loading-screen.js <pasta-com-ozj> [padrão]
 * 
 * Exemplo: node merge-loading-screen.js "C:\MU\Data\Interface" "lo_back_s5_im"
 */

const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

// Função para decodificar OZJ (pode ser JPEG direto ou encriptado)
function decodeOZJ(buffer) {
  const data = new Uint8Array(buffer);
  
  // Verifica se já é um JPEG válido (FF D8)
  if (data[0] === 0xFF && data[1] === 0xD8) {
    console.log('      -> Ja e JPEG, sem encriptacao');
    return buffer;
  }
  
  // Se não, tenta XOR com chave 0xFC
  console.log('      -> Aplicando XOR (0xFC)');
  const decoded = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decoded[i] = data[i] ^ 0xFC;
  }
  
  return Buffer.from(decoded);
}

async function mergePieces(folderPath, pattern = '') {
  console.log('\n========================================');
  console.log('MONTADOR DE LOADING SCREEN - MU ONLINE');
  console.log('========================================\n');
  console.log('Pasta:', folderPath);
  console.log('Padrao:', pattern || 'todos os .OZJ');
  console.log('----------------------------------------\n');

  // Lê todos os arquivos da pasta
  const files = fs.readdirSync(folderPath)
    .filter(f => f.toLowerCase().endsWith('.ozj'))
    .filter(f => !pattern || f.toLowerCase().includes(pattern.toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error('[ERRO] Nenhum arquivo OZJ encontrado!');
    process.exit(1);
  }

  console.log(`Encontrados ${files.length} arquivos:`);
  files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));

  // Converte todos os OZJ para JPG temporários
  console.log('\nConvertendo OZJ -> JPG...');
  const tempDir = path.join(__dirname, 'temp-loading');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const jpgFiles = [];
  for (const file of files) {
    const ozjPath = path.join(folderPath, file);
    const jpgName = file.replace(/\.ozj$/i, '.jpg');
    const jpgPath = path.join(tempDir, jpgName);

    console.log(`   ${file}`);
    const ozjData = fs.readFileSync(ozjPath);
    const jpgData = decodeOZJ(ozjData);
    fs.writeFileSync(jpgPath, jpgData);
    
    jpgFiles.push(jpgPath);
  }

  // Carrega todas as imagens
  console.log('\nAnalisando dimensoes...');
  const images = [];
  for (const jpgPath of jpgFiles) {
    try {
      const img = await Jimp.read(jpgPath);
      images.push(img);
    } catch (err) {
      console.error(`   [ERRO] ao carregar ${path.basename(jpgPath)}: ${err.message}`);
      throw err;
    }
  }

  const pieceWidth = images[0].getWidth();
  const pieceHeight = images[0].getHeight();
  console.log(`   Tamanho de cada peca: ${pieceWidth}x${pieceHeight}px`);

  // Detecta grid automaticamente
  const totalPieces = images.length;
  let cols = 0;
  let rows = 0;

  // Tenta encontrar divisor que faça sentido
  for (let c = 1; c <= totalPieces; c++) {
    if (totalPieces % c === 0) {
      const r = totalPieces / c;
      // Prefere layouts mais "quadrados" ou horizontais
      if (c >= r) {
        cols = c;
        rows = r;
        break;
      }
    }
  }

  // Se não achou, usa layout horizontal
  if (cols === 0) {
    cols = totalPieces;
    rows = 1;
  }

  console.log(`   Layout detectado: ${cols} colunas x ${rows} linhas`);

  // Cria imagem final
  const finalWidth = pieceWidth * cols;
  const finalHeight = pieceHeight * rows;
  console.log(`   Imagem final: ${finalWidth}x${finalHeight}px`);

  console.log('\nMontando imagem completa...');
  const finalImage = new Jimp(finalWidth, finalHeight);

  // Monta o quebra-cabeça
  for (let i = 0; i < images.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * pieceWidth;
    const y = row * pieceHeight;
    
    finalImage.composite(images[i], x, y);
    console.log(`   [OK] Peca ${i + 1}/${images.length} (linha ${row + 1}, coluna ${col + 1})`);
  }

  // Salva imagem final
  const outputName = pattern ? `${pattern}_COMPLETO.png` : 'loading_screen_COMPLETO.png';
  const outputPath = path.join(__dirname, outputName);
  
  await finalImage.writeAsync(outputPath);

  // Salva informações de layout
  const layoutInfo = {
    totalPieces: images.length,
    cols,
    rows,
    pieceWidth,
    pieceHeight,
    finalWidth,
    finalHeight,
    pattern,
    originalFiles: files
  };

  const layoutPath = path.join(__dirname, outputName.replace('.png', '_layout.json'));
  fs.writeFileSync(layoutPath, JSON.stringify(layoutInfo, null, 2));

  // Limpa arquivos temporários
  console.log('\nLimpando arquivos temporarios...');
  jpgFiles.forEach(f => fs.unlinkSync(f));
  fs.rmdirSync(tempDir);

  console.log('\n----------------------------------------');
  console.log('CONCLUIDO\n');
  console.log(`Imagem completa: ${outputPath}`);
  console.log(`Informacoes: ${layoutPath}`);
  console.log('\nProximos passos:');
  console.log('   1. Editar a imagem no Photoshop/GIMP');
  console.log('   2. Salvar como PNG (mesmo nome)');
  console.log('   3. Usar split-loading-screen.js para dividir de volta');
  console.log('========================================\n');
}

// Execução
const folderPath = process.argv[2];
const pattern = process.argv[3];

if (!folderPath) {
  console.log('Uso: node merge-loading-screen.js <pasta> [padrao]');
  console.log('');
  console.log('Exemplos:');
  console.log('  node merge-loading-screen.js "C:\\MU\\Data\\Interface"');
  console.log('  node merge-loading-screen.js "C:\\MU\\Data\\Interface" "lo_back_s5_im"');
  process.exit(1);
}

if (!fs.existsSync(folderPath)) {
  console.error(`[ERRO] Pasta nao encontrada: ${folderPath}`);
  process.exit(1);
}

mergePieces(folderPath, pattern).catch(err => {
  console.error('\n[ERRO]:', err.message);
  console.error(err.stack);
  process.exit(1);
});
