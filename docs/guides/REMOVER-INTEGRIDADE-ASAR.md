# 🔧 Guia: Remover Recurso de Integridade do ASAR

Este guia explica como remover o recurso de integridade do ASAR do executável para permitir assinatura digital posterior.

## 📋 Por que isso é necessário?

O `electron-builder` insere um recurso de integridade do ASAR no executável durante o build. Quando você assina o executável **depois** do build, essa assinatura modifica o arquivo, e a verificação de integridade pode falhar ou impedir a assinatura.

## 🎯 Solução: Remover o Recurso Antes de Assinar

### Método 1: Resource Hacker (Recomendado - Mais Fácil) ⭐

**Resource Hacker** é uma ferramenta gratuita e fácil de usar para editar recursos de executáveis Windows.

#### Passo 1: Baixar Resource Hacker

1. Acesse: http://www.angusj.com/resourcehacker/
2. Baixe a versão mais recente (é gratuito)
3. Extraia o arquivo ZIP
4. Execute `ResourceHacker.exe` (não precisa instalar)

#### Passo 2: Abrir o Executável

1. No Resource Hacker, vá em **File > Open**
2. Navegue até o executável:
   - `dist-electron\MuTools-1.0.0-portable.exe` (versão portable)
   - `dist-electron\win-unpacked\MuTools.exe` (versão unpacked)
3. Clique em **Open**

#### Passo 3: Encontrar o Recurso de Integridade

1. No painel esquerdo, expanda as pastas:
   - Procure por **"RCData"** (Recursos Customizados)
   - Ou procure por **"Custom Resources"**
2. Dentro dessas pastas, procure por recursos com nomes como:
   - `ASAR`
   - `INTEGRITY`
   - `ElectronAsarIntegrity`
   - Ou qualquer recurso que pareça relacionado a integridade

#### Passo 4: Remover o Recurso

1. Clique com o **botão direito** no recurso encontrado
2. Selecione **"Delete Resource"**
3. Confirme a remoção

#### Passo 5: Salvar

1. Vá em **File > Save** (ou pressione `Ctrl+S`)
2. Feche o Resource Hacker
3. **Pronto!** O executável está pronto para assinatura

---

### Método 2: Script Automatizado (Avançado)

Se você quiser automatizar o processo, use os scripts fornecidos:

#### Usando PowerShell (Windows)

```powershell
# Execute o script PowerShell
.\remove-asar-integrity.ps1 -ExePath "dist-electron\MuTools-1.0.0-portable.exe"
```

O script irá:
- Criar um backup do executável
- Fornecer instruções detalhadas
- Abrir o Resource Hacker automaticamente (se instalado)

#### Usando Node.js

```bash
# Execute o script Node.js
node remove-asar-integrity.js dist-electron/MuTools-1.0.0-portable.exe
```

---

## 🔄 Fluxo de Trabalho Recomendado

### Para Você (Desenvolvedor):

1. **Build do aplicativo:**
   ```bash
   npm run build
   npm run electron:build
   ```

2. **Remover recurso de integridade:**
   - Use o Resource Hacker (Método 1)
   - Ou execute o script PowerShell/Node.js

3. **Enviar para seu amigo:**
   - Envie o executável já com o recurso removido
   - Ou envie o executável + este guia

### Para Seu Amigo (Assinador):

1. **Receber o executável** (já com recurso removido)
2. **Assinar normalmente:**
   ```bash
   signtool sign /f certificado.pfx /p senha /t http://timestamp.digicert.com executavel.exe
   ```
3. **Pronto!** O executável está assinado e funcionando

---

## ⚠️ Importante

- **Sempre faça backup** antes de modificar o executável
- O backup é criado automaticamente pelos scripts (`.backup`)
- Se algo der errado, restaure o backup
- O executável **continuará funcionando normalmente** após remover o recurso
- A única diferença é que não haverá verificação de integridade em runtime (o que é aceitável se você confia no processo de distribuição)

---

## 🆘 Problemas Comuns

### "Não encontrei o recurso de integridade"

- **Solução:** O recurso pode ter um nome diferente. Procure em todas as seções de recursos customizados (RCData)
- **Alternativa:** Se não encontrar, o executável pode já estar pronto para assinatura

### "O executável parou de funcionar"

- **Solução:** Restaure o backup (arquivo `.backup`)
- **Causa:** Você pode ter removido o recurso errado

### "Ainda não consigo assinar"

- **Solução:** Verifique se você removeu o recurso correto
- **Alternativa:** Tente assinar o executável unpacked (`win-unpacked\MuTools.exe`) primeiro para testar

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique se seguiu todos os passos
2. Tente com o executável unpacked primeiro
3. Verifique os logs de assinatura para erros específicos

---

**Boa sorte! 🚀**
