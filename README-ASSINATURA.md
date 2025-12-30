# 🔐 Guia Rápido: Preparar Executável para Assinatura Digital

## 🚀 Processo Rápido (3 passos)

### 1️⃣ Build do Aplicativo
```bash
npm run build
npm run electron:build
```

### 2️⃣ Remover Recurso de Integridade

**Opção A - Script Automático (Mais Fácil):**
```bash
npm run remove-integrity:portable
```

**Opção B - Manual com Resource Hacker:**
1. Baixe: http://www.angusj.com/resourcehacker/
2. Abra o executável no Resource Hacker
3. Procure em "RCData" por recursos relacionados a "ASAR" ou "INTEGRITY"
4. Delete o recurso encontrado
5. Salve o arquivo

### 3️⃣ Enviar para Assinatura
Envie o executável (já com recurso removido) para seu amigo assinar.

---

## 📋 Scripts Disponíveis

```bash
# Remover integridade de um executável específico
npm run remove-integrity <caminho-do-executavel>

# Remover integridade da versão portable (pré-configurado)
npm run remove-integrity:portable
```

---

## 📖 Documentação Completa

Para instruções detalhadas, consulte: **`GUIA-REMOVER-INTEGRIDADE-ASAR.md`**

---

## ⚠️ Importante

- ✅ Sempre é criado um backup (`.backup`) automaticamente
- ✅ O executável continua funcionando normalmente após remover o recurso
- ✅ Isso é necessário apenas se você assinar **depois** do build

---

**Pronto! Agora seu executável está preparado para assinatura digital! 🎉**
