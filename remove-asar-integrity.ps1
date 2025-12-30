# Script PowerShell para remover recurso de integridade do ASAR
# Isso permite que o executável seja assinado digitalmente sem problemas
#
# Uso: .\remove-asar-integrity.ps1 -ExePath "caminho\do\executavel.exe"
# Exemplo: .\remove-asar-integrity.ps1 -ExePath "dist-electron\MuTools-1.0.0-portable.exe"

param(
    [Parameter(Mandatory=$true)]
    [string]$ExePath
)

# Verifica se o arquivo existe
if (-not (Test-Path $ExePath)) {
    Write-Host "❌ Erro: Arquivo não encontrado: $ExePath" -ForegroundColor Red
    exit 1
}

$absolutePath = Resolve-Path $ExePath
$backupPath = "$absolutePath.backup"

Write-Host "🔧 Removendo recurso de integridade do ASAR..." -ForegroundColor Cyan
Write-Host "📁 Arquivo: $absolutePath" -ForegroundColor Gray

# Cria backup
Write-Host "`n💾 Criando backup..." -ForegroundColor Yellow
Copy-Item $absolutePath $backupPath -Force
Write-Host "✅ Backup criado: $backupPath" -ForegroundColor Green

Write-Host "`n📝 INSTRUÇÕES PARA REMOVER O RECURSO:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nOPÇÃO 1 - Resource Hacker (Recomendado - Mais Fácil):" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "1. Baixe Resource Hacker (gratuito):" -ForegroundColor White
Write-Host "   http://www.angusj.com/resourcehacker/" -ForegroundColor Blue
Write-Host "`n2. Abra o executável no Resource Hacker:" -ForegroundColor White
Write-Host "   - File > Open > Selecione: $absolutePath" -ForegroundColor Gray
Write-Host "`n3. Procure por recursos customizados:" -ForegroundColor White
Write-Host "   - Expanda a pasta 'RCData' ou 'Custom Resources'" -ForegroundColor Gray
Write-Host "   - Procure por recursos com nomes como:" -ForegroundColor Gray
Write-Host "     * ASAR" -ForegroundColor Gray
Write-Host "     * INTEGRITY" -ForegroundColor Gray
Write-Host "     * ElectronAsarIntegrity" -ForegroundColor Gray
Write-Host "`n4. Remova o recurso:" -ForegroundColor White
Write-Host "   - Clique com botão direito no recurso encontrado" -ForegroundColor Gray
Write-Host "   - Selecione 'Delete Resource'" -ForegroundColor Gray
Write-Host "`n5. Salve o arquivo:" -ForegroundColor White
Write-Host "   - File > Save (ou Ctrl+S)" -ForegroundColor Gray
Write-Host "   - Feche o Resource Hacker" -ForegroundColor Gray

Write-Host "`nOPÇÃO 2 - Usar ferramenta de linha de comando:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Se você tiver acesso a ferramentas como:" -ForegroundColor White
Write-Host "  - Resource Hacker CLI" -ForegroundColor Gray
Write-Host "  - PE Explorer" -ForegroundColor Gray
Write-Host "  - Outras ferramentas de edição de recursos PE" -ForegroundColor Gray
Write-Host "Você pode remover o recurso programaticamente." -ForegroundColor White

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Backup criado em: $backupPath" -ForegroundColor Green
Write-Host "📌 Após remover o recurso, o executável estará pronto para assinatura!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Pergunta se quer abrir o Resource Hacker (se instalado)
$resourceHackerPath = "C:\Program Files\Resource Hacker\ResourceHacker.exe"
if (Test-Path $resourceHackerPath) {
    $response = Read-Host "Deseja abrir o Resource Hacker agora? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Start-Process $resourceHackerPath -ArgumentList $absolutePath
    }
} else {
    Write-Host "💡 Dica: Instale o Resource Hacker para facilitar o processo!" -ForegroundColor Yellow
}
