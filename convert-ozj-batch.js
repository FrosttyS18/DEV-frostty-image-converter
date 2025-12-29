/**
 * Script para converter OZJ para JPG em lote
 * Uso: node convert-ozj-batch.js <pasta-origem> <pasta-destino> [padrão]
 * 
 * Exemplo: node convert-ozj-batch.js "C:\MU\Data\Interface" "output-jpg" "lo_back_s5_im"
 */

const fs = require('fs');
const path = require('path');

// Função para decodificar OZJ (pode ser JPEG direto ou encriptado)
function decodeOZJ(buffer) {
  const data = new Uint8Array(buffer);
  
  // Verifica se já é um JPEG válido (FF D8)
  if (data[0] === 0xFF && data[1] === 0xD8) {
    return { buffer, wasEncrypted: false };
  }
  
  // Se não, tenta XOR com chave 0xFC
  const decoded = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decoded[i] = data[i] ^ 0xFC;
  }
  
  // Verifica se ficou válido após XOR
  if (decoded[0] === 0xFF && decoded[1] === 0xD8) {
    return { buffer: Buffer.from(decoded), wasEncrypted: true };
  }
  
  // Se não ficou válido, retorna original
  return { buffer, wasEncrypted: false };
}

function convertBatch(sourceFolder, outputFolder, pattern = '') {
  console.log('\n========================================');
  console.log('CONVERSOR OZJ -> JPG EM LOTE');
  console.log('========================================\n');
  console.log('Origem:', sourceFolder);
  console.log('Destino:', outputFolder);
  console.log('Padrao:', pattern || 'todos os .OZJ');
  console.log('----------------------------------------\n');

  // Cria pasta de saída
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Lê todos os arquivos
  const files = fs.readdirSync(sourceFolder)
    .filter(f => f.toLowerCase().endsWith('.ozj'))
    .filter(f => !pattern || f.toLowerCase().includes(pattern.toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error('[ERRO] Nenhum arquivo OZJ encontrado!');
    process.exit(1);
  }

  console.log(`Encontrados ${files.length} arquivos\n`);

  let converted = 0;
  let encrypted = 0;
  let direct = 0;

  for (const file of files) {
    const ozjPath = path.join(sourceFolder, file);
    const jpgName = file.replace(/\.ozj$/i, '.jpg');
    const jpgPath = path.join(outputFolder, jpgName);

    try {
      const ozjData = fs.readFileSync(ozjPath);
      const { buffer, wasEncrypted } = decodeOZJ(ozjData);
      fs.writeFileSync(jpgPath, buffer);
      
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
      const status = wasEncrypted ? '[XOR]' : '[DIRETO]';
      console.log(`  [OK] ${file.padEnd(30)} -> ${jpgName.padEnd(30)} (${sizeMB} MB) ${status}`);
      
      converted++;
      if (wasEncrypted) encrypted++;
      else direct++;
      
    } catch (err) {
      console.error(`  [ERRO] ${file} - ${err.message}`);
    }
  }

  console.log('\n----------------------------------------');
  console.log('CONCLUIDO\n');
  console.log('Estatisticas:');
  console.log(`  Total convertido: ${converted} arquivos`);
  console.log(`  Encriptados (XOR): ${encrypted}`);
  console.log(`  JPEG direto: ${direct}`);
  console.log(`\nArquivos salvos em: ${path.resolve(outputFolder)}`);
  console.log('\nProximos passos:');
  console.log('  1. Abra os JPG no Photoshop/GIMP');
  console.log('  2. Monte a imagem completa manualmente');
  console.log('  3. Use o script reverso para dividir de volta');
  console.log('========================================\n');
}

// Execução
const sourceFolder = process.argv[2];
const outputFolder = process.argv[3] || 'output-jpg';
const pattern = process.argv[4];

if (!sourceFolder) {
  console.log('Uso: node convert-ozj-batch.js <pasta-origem> [pasta-destino] [padrao]');
  console.log('');
  console.log('Exemplos:');
  console.log('  node convert-ozj-batch.js "C:\\MU\\Data\\Interface" "loading-jpgs"');
  console.log('  node convert-ozj-batch.js "C:\\MU\\Data\\Interface" "loading-jpgs" "lo_back_s5_im"');
  process.exit(1);
}

if (!fs.existsSync(sourceFolder)) {
  console.error(`[ERRO] Pasta nao encontrada: ${sourceFolder}`);
  process.exit(1);
}

convertBatch(sourceFolder, outputFolder, pattern);
