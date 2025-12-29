# Script PowerShell para testar DLL ozd.dll

$ErrorActionPreference = "Stop"

Write-Host "=" * 80
Write-Host "TESTE: Carregando ozd.dll com PowerShell"
Write-Host "=" * 80

$dllPath = Join-Path $PSScriptRoot "arquivos para estudar o formato\arquivos enviado pelo nosso amigo\ozd.dll"

Write-Host "`nDLL Path: $dllPath"
Write-Host "DLL existe? $(Test-Path $dllPath)"

if (Test-Path $dllPath) {
    try {
        # Carrega a DLL
        $assembly = [System.Reflection.Assembly]::LoadFile($dllPath)
        
        Write-Host "`nDLL carregada com sucesso!"
        Write-Host "Assembly: $($assembly.FullName)"
        
        # Lista tipos exportados
        $types = $assembly.GetExportedTypes()
        Write-Host "`nTipos exportados: $($types.Count)"
        
        foreach ($type in $types) {
            Write-Host "  - $($type.Name)"
            
            # Lista metodos
            $methods = $type.GetMethods() | Where-Object { $_.IsPublic -and -not $_.IsSpecialName }
            foreach ($method in $methods) {
                Write-Host "      Metodo: $($method.Name)($($method.GetParameters().Count) params)"
            }
        }
        
    } catch {
        Write-Host "`nErro (provavelmente DLL nativa Win32, nao .NET):"
        Write-Host $_.Exception.Message
        
        Write-Host "`n[ALTERNATIVA] Tentando carregar como DLL Win32 nativa..."
        
        # Para DLL Win32 nativa, precisamos usar Add-Type com P/Invoke
        $signature = @'
        [DllImport("USER32.dll")]
        public static extern int MessageBox(int hWnd, string text, string caption, int options);
'@
        
        Write-Host "DLL e nativa Win32 (C/C++), nao .NET"
        Write-Host "Para usar, precisariamos:"
        Write-Host "  1. Descobrir as funcoes exportadas (usar dumpbin)"
        Write-Host "  2. Criar wrapper C# com P/Invoke"
        Write-Host "  3. Ou usar ferramentas de terceiros"
    }
}

Write-Host "`n" + ("=" * 80)
