# 📋 Passo a Passo: Remover Recurso de Integridade do ASAR

## ✅ Status Atual

- ✅ Backup criado: `MuTools-1.0.0-portable.exe.backup`
- ✅ Executável pronto: `MuTools-1.0.0-portable.exe` (86.17 MB)
- ⏳ Próximo passo: Remover recurso de integridade

---

## 🎯 Passo a Passo Completo

### PASSO 1: Baixar Resource Hacker

1. **Site já aberto no navegador** (se não abriu, acesse: http://www.angusj.com/resourcehacker/)
2. **Clique em "Download"** (geralmente um botão verde)
3. **Baixe o arquivo ZIP** (ResourceHacker.zip - aproximadamente 2-3 MB)
4. **Extraia o ZIP** em uma pasta (ex: `C:\Tools\ResourceHacker\`)
5. **NÃO precisa instalar** - é um executável portátil!

---

### PASSO 2: Abrir o Executável no Resource Hacker

1. **Abra o Resource Hacker**
   - Navegue até a pasta onde extraiu
   - Execute `ResourceHacker.exe`
   - Aceite os termos (se aparecer)

2. **Abra o executável do MuTools**
   - No Resource Hacker: **File > Open** (ou `Ctrl+O`)
   - Navegue até: `C:\App-mu\dist-electron\`
   - Selecione: `MuTools-1.0.0-portable.exe`
   - Clique em **Open**

---

### PASSO 3: Encontrar o Recurso de Integridade

1. **No painel esquerdo**, você verá uma árvore de recursos
2. **Procure pela pasta "RCData"** (Recursos Customizados)
   - Pode estar com nome similar como "Custom Resources"
   - Pode estar dentro de outra pasta
3. **Expanda a pasta RCData** (clique no + ou seta)
4. **Procure por recursos com nomes como:**
   - `ASAR`
   - `INTEGRITY`
   - `ElectronAsarIntegrity`
   - Ou qualquer recurso que pareça relacionado

**💡 Dica:** O recurso geralmente tem um nome relacionado a "ASAR" ou "INTEGRITY"

---

### PASSO 4: Remover o Recurso

1. **Clique com o botão direito** no recurso encontrado
2. **Selecione "Delete Resource"** (ou "Remover Recurso")
3. **Confirme a remoção** (se pedir confirmação)

**⚠️ Importante:** 
- Remova APENAS recursos relacionados a ASAR/INTEGRITY
- NÃO remova outros recursos (pode quebrar o executável)

---

### PASSO 5: Salvar o Arquivo

1. **Vá em File > Save** (ou pressione `Ctrl+S`)
2. **Aguarde a mensagem de sucesso**
3. **Feche o Resource Hacker**

---

### PASSO 6: Verificar

1. **Verifique se o arquivo foi modificado:**
   ```powershell
   Get-Item "dist-electron\MuTools-1.0.0-portable.exe" | Select-Object LastWriteTime
   ```
   - A data de modificação deve ser atual

2. **Teste o executável (opcional):**
   - Execute o `MuTools-1.0.0-portable.exe`
   - Verifique se abre normalmente
   - Se abrir, está funcionando! ✅

---

## ✅ Pronto!

Agora o executável está pronto para ser assinado digitalmente!

**Próximos passos:**
1. Envie o `MuTools-1.0.0-portable.exe` para seu amigo
2. Ele pode assinar normalmente sem problemas
3. O backup está salvo em caso de necessidade

---

## 🆘 Problemas?

### "Não encontrei o recurso RCData"
- **Solução:** Procure em todas as pastas de recursos
- O recurso pode estar em outra seção

### "Não encontrei recursos ASAR/INTEGRITY"
- **Solução:** Pode ser que o recurso tenha outro nome
- Procure por qualquer recurso que pareça suspeito
- Se não encontrar, o executável pode já estar pronto

### "O executável parou de funcionar"
- **Solução:** Restaure o backup:
  ```powershell
  Copy-Item "dist-electron\MuTools-1.0.0-portable.exe.backup" "dist-electron\MuTools-1.0.0-portable.exe" -Force
  ```

---

**Boa sorte! 🚀**
