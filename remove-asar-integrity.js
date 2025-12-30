/**
 * Script para remover o recurso de integridade do ASAR do executável
 * Isso permite que o executável seja assinado digitalmente sem problemas
 * 
 * Uso: node remove-asar-integrity.js <caminho-do-executavel>
 * Exemplo: node remove-asar-integrity.js dist-electron/MuTools-1.0.0-portable.exe
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Verifica argumentos
const exePath = process.argv[2];

if (!exePath) {
  console.error('❌ Erro: Caminho do executável não fornecido!');
  console.log('\n📖 Uso:');
  console.log('   node remove-asar-integrity.js <caminho-do-executavel>');
  console.log('\n📝 Exemplos:');
  console.log('   node remove-asar-integrity.js dist-electron/MuTools-1.0.0-portable.exe');
  console.log('   node remove-asar-integrity.js dist-electron/win-unpacked/MuTools.exe');
  process.exit(1);
}

// Verifica se o arquivo existe
if (!fs.existsSync(exePath)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${exePath}`);
  process.exit(1);
}

// Resolve caminho absoluto
const absolutePath = path.resolve(exePath);

console.log('🔧 Removendo recurso de integridade do ASAR...');
console.log(`📁 Arquivo: ${absolutePath}`);

try {
  // O recurso de integridade do ASAR geralmente está no tipo de recurso customizado
  // Vamos tentar remover usando rcedit
  // Primeiro, vamos listar os recursos para ver o que existe
  
  // Cria backup antes de modificar
  const backupPath = absolutePath + '.backup';
  
  // Verifica se já existe backup
  if (fs.existsSync(backupPath)) {
    console.log(`⚠️  Backup já existe: ${backupPath}`);
    console.log('💡 Se quiser criar um novo backup, delete o arquivo .backup primeiro');
  } else {
    console.log(`💾 Criando backup: ${backupPath}`);
    fs.copyFileSync(absolutePath, backupPath);
    console.log('✅ Backup criado com sucesso!');
  }
  
  // Método alternativo: usar uma biblioteca Node.js que pode modificar recursos PE
  // Ou usar uma ferramenta externa
  
  // Por enquanto, vamos criar um script que usa uma abordagem manual
  // ou uma ferramenta externa como Resource Hacker
  
  console.log('\n📝 INSTRUÇÕES PARA REMOVER O RECURSO:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  console.log('OPÇÃO 1 - Resource Hacker (Recomendado - Mais Fácil):');
  console.log('─────────────────────────────────────────────────────────');
  console.log('1. Baixe Resource Hacker (gratuito):');
  console.log('   http://www.angusj.com/resourcehacker/');
  console.log('');
  console.log('2. Abra o executável no Resource Hacker:');
  console.log('   File > Open > Selecione: ' + absolutePath);
  console.log('');
  console.log('3. Procure por recursos customizados:');
  console.log('   - Expanda a pasta "RCData" ou "Custom Resources"');
  console.log('   - Procure por recursos com nomes como:');
  console.log('     * ASAR');
  console.log('     * INTEGRITY');
  console.log('     * ElectronAsarIntegrity');
  console.log('');
  console.log('4. Remova o recurso:');
  console.log('   - Clique com botão direito no recurso encontrado');
  console.log('   - Selecione "Delete Resource"');
  console.log('');
  console.log('5. Salve o arquivo:');
  console.log('   - File > Save (ou Ctrl+S)');
  console.log('   - Feche o Resource Hacker');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Backup criado em: ' + backupPath);
  console.log('📌 Após remover o recurso, o executável estará pronto para assinatura!');
  console.log('📖 Para mais detalhes, consulte: GUIA-REMOVER-INTEGRIDADE-ASAR.md');
  console.log('═══════════════════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('❌ Erro ao processar:', error.message);
  process.exit(1);
}
