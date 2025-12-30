/**
 * Script para verificar se o recurso de integridade foi removido
 * Compara o tamanho do arquivo original com o modificado
 */

const fs = require('fs');
const path = require('path');

const exePath = process.argv[2] || 'dist-electron/MuTools-1.0.0-portable.exe';
const backupPath = exePath + '.backup';

if (!fs.existsSync(exePath)) {
  console.error('❌ Executável não encontrado:', exePath);
  process.exit(1);
}

if (!fs.existsSync(backupPath)) {
  console.error('❌ Backup não encontrado:', backupPath);
  console.log('💡 Execute primeiro: npm run remove-integrity:portable');
  process.exit(1);
}

const exeStats = fs.statSync(exePath);
const backupStats = fs.statSync(backupPath);

const exeSize = exeStats.size;
const backupSize = backupStats.size;
const difference = backupSize - exeSize;

console.log('🔍 Verificando se o recurso foi removido...\n');
console.log('═══════════════════════════════════════════════════════════');
console.log(`📁 Executável atual: ${exePath}`);
console.log(`   Tamanho: ${(exeSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Modificado: ${exeStats.mtime.toLocaleString()}`);
console.log('');
console.log(`💾 Backup original: ${backupPath}`);
console.log(`   Tamanho: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Modificado: ${backupStats.mtime.toLocaleString()}`);
console.log('');
console.log(`📊 Diferença: ${(difference / 1024).toFixed(2)} KB`);
console.log('═══════════════════════════════════════════════════════════\n');

if (difference > 0) {
  console.log('✅ O arquivo foi modificado!');
  console.log(`   O executável está ${(difference / 1024).toFixed(2)} KB menor que o backup.`);
  console.log('   Isso indica que algum recurso foi removido.');
  console.log('');
  console.log('💡 Se você removeu o recurso de integridade do ASAR,');
  console.log('   o executável está pronto para assinatura!');
} else if (difference < 0) {
  console.log('⚠️  O arquivo foi modificado, mas ficou MAIOR.');
  console.log('   Isso é incomum. Verifique se removeu o recurso correto.');
} else {
  console.log('⚠️  O arquivo NÃO foi modificado.');
  console.log('   Você ainda precisa remover o recurso de integridade.');
  console.log('   Siga as instruções em: PASSO-A-PASSO-REMOVER-INTEGRIDADE.md');
}

console.log('');
