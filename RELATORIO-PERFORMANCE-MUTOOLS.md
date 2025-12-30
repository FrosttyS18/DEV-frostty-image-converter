# 📊 Relatório de Performance - Startup do MuTools

## 🔍 Análise Realizada

**Data:** 30/12/2025  
**App:** MuTools v1.0.0 (Conversor de Imagens Mu Online)  
**Foco:** Tempo de inicialização e causas de lentidão

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **SPLASH SCREEN COM DELAY FORÇADO DE 3.5s** 🔴 CRÍTICO
**Localização:** `electron/main.js` linha 467

```javascript
const MIN_SPLASH_DURATION = 3500; // 3.5 segundos mínimo
```

**Impacto:**
- O app **sempre espera 3.5 segundos** antes de mostrar a janela principal
- Mesmo que carregue em 0.5s, o usuário espera 3.5s
- Isso é **artificial** e não reflete o tempo real de carregamento
- **Maior causa de lentidão percebida**

**Solução:**
- Remover ou reduzir para 500ms (apenas para animação suave)
- Fechar splash assim que a janela principal estiver pronta

---

### 2. **DEPENDÊNCIA NÃO UTILIZADA: JIMP** 🔴 CRÍTICO
**Localização:** `package.json` linha 34

```json
"jimp": "^0.22.12"
```

**Problema:**
- Jimp é uma biblioteca **muito pesada** (~2-3 MB compilada)
- **NÃO está sendo usada** no código (nenhum import encontrado)
- Está sendo empacotada no app sem necessidade
- Aumenta o tamanho do executável de ~86 MB

**Impacto:**
- Aumenta o tamanho do executável
- Pode estar sendo carregada na memória mesmo sem uso
- Aumenta o tempo de inicialização do Electron

**Solução:**
```bash
npm uninstall jimp
```
- Reduzirá o tamanho do app significativamente
- Não afetará funcionalidade (não está sendo usada)

---

### 3. **IMPORTS SÍNCRONOS DE BIBLIOTECAS PESADAS** 🟡 MÉDIO
**Localização:** `src/utils/ozt.ts` e `src/utils/ozj.ts`

```typescript
// ozt.ts linha 1
import pako from 'pako';

// ozj.ts linha 1-2
import pako from 'pako';
import jpeg from 'jpeg-js';
```

**Problema:**
- Bibliotecas são importadas no topo do arquivo (síncrono)
- Carregadas no startup mesmo quando não usadas
- Parse e inicialização acontecem antes do usuário precisar

**Impacto:**
- Parse de JavaScript mais lento no startup
- Memória alocada antes de ser necessária
- Usuário pode nunca usar OZT/OZJ, mas bibliotecas já estão carregadas

**Solução:**
- Implementar lazy loading (dynamic imports)
- Carregar apenas quando usuário seleciona arquivo OZT/OZJ
- Reduz startup inicial

---

### 4. **BUNDLE JAVASCRIPT GRANDE** 🟡 MÉDIO
**Tamanho:** ~303 KB (index-zrkzua0G.js)

**Conteúdo:**
- React + ReactDOM (~140 KB)
- Todas as bibliotecas (pako, jpeg-js, crypto-js)
- Todo o código da aplicação em um único bundle
- Sem code splitting

**Impacto:**
- Parse e execução do JavaScript leva tempo
- Tudo carrega de uma vez, mesmo código não usado inicialmente
- Sem otimização de carregamento progressivo

**Solução:**
- Implementar code splitting (lazy loading)
- Separar bibliotecas pesadas em chunks separados
- Carregar apenas o necessário no startup
- React.lazy() para componentes pesados

---

### 5. **MÚLTIPLAS FONTES INTER CARREGADAS** 🟡 MÉDIO
**Quantidade:** 18 arquivos de fonte (WOFF + WOFF2)

**Tamanho Total:** ~500 KB de fontes

**Problema:**
- Carregando todos os pesos (100, 200, 300, 400, 500, 600, 700, 800, 900)
- Carregando em dois formatos (WOFF e WOFF2)
- A maioria não é usada no app (provavelmente só 400, 500, 700)

**Impacto:**
- Download de ~500 KB de fontes no startup
- Parsing e aplicação de fontes
- Bloqueio de renderização até fontes carregarem

**Solução:**
- Carregar apenas os pesos usados (400, 500, 700)
- Usar apenas WOFF2 (melhor compressão, suporte moderno)
- Implementar font subsetting (apenas caracteres usados)
- Reduzir para ~100-150 KB

---

### 6. **ASSET GRANDE: BACKGROUND IMAGE** 🟢 BAIXO
**Arquivo:** `backgroundapp-D6blz2g8.webp` (208 KB)

**Status:** Aceitável, mas pode otimizar

**Solução (opcional):**
- Lazy load da imagem de fundo
- Carregar apenas quando necessário
- Ou usar CSS gradients ao invés de imagem

---

## 📈 MÉTRICAS ATUAIS

| Métrica | Valor | Status |
|---------|-------|--------|
| **Tempo mínimo de splash** | 3.5s | 🔴 Crítico |
| **Bundle JS** | ~303 KB | 🟡 Aceitável |
| **Fontes** | ~500 KB | 🟡 Pode otimizar |
| **Background image** | ~208 KB | 🟢 OK |
| **Dependências não usadas** | Jimp (~2-3 MB) | 🔴 Remover |
| **Tamanho executável** | ~86 MB | 🟡 Pode reduzir |

---

## ✅ SOLUÇÕES PRIORITÁRIAS

### 🔴 Prioridade 1: REMOVER DELAY DO SPLASH
**Impacto:** Redução imediata de **3.5s** no tempo percebido

```javascript
// ANTES (electron/main.js linha 467):
const MIN_SPLASH_DURATION = 3500; // 3.5 segundos mínimo

// DEPOIS:
const MIN_SPLASH_DURATION = 500; // Apenas para animação suave
// Ou remover completamente:
// Fechar splash assim que mainWindow estiver ready
```

**Resultado esperado:** App abre **3 segundos mais rápido**

---

### 🔴 Prioridade 2: REMOVER JIMP
**Impacto:** Redução de **~2-3 MB** no tamanho do app

```bash
npm uninstall jimp
```

**Resultado esperado:** 
- Executável menor
- Startup mais rápido
- Menos memória usada

---

### 🟡 Prioridade 3: LAZY LOADING DE BIBLIOTECAS
**Impacto:** Startup mais rápido, carrega apenas quando necessário

```typescript
// ANTES (src/utils/ozt.ts):
import pako from 'pako';

// DEPOIS:
// Carregar dinamicamente quando necessário
const pako = await import('pako');
```

**Resultado esperado:** 
- Startup inicial mais rápido
- Bibliotecas carregam apenas quando usuário precisa

---

### 🟡 Prioridade 4: OTIMIZAR FONTES
**Impacto:** Redução de **~300-400 KB** no download

**Ações:**
1. Usar apenas pesos necessários (400, 500, 700)
2. Usar apenas WOFF2
3. Font subsetting (apenas caracteres usados)

**Resultado esperado:** 
- Download inicial 40% menor
- Renderização mais rápida

---

## 🎯 RESULTADO ESPERADO APÓS OTIMIZAÇÕES

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Tempo percebido** | ~4-5s | ~1-2s | **60-70% mais rápido** |
| **Tamanho do app** | ~86 MB | ~83-84 MB | **~3 MB menor** |
| **Download inicial** | ~1 MB | ~600 KB | **40% menor** |
| **Tempo real de startup** | ~1-2s | ~0.5-1s | **50% mais rápido** |

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **Remover delay mínimo do splash screen** (Prioridade 1)
- [ ] **Remover dependência `jimp` não utilizada** (Prioridade 2)
- [ ] **Implementar lazy loading de pako e jpeg-js** (Prioridade 3)
- [ ] **Otimizar carregamento de fontes** (Prioridade 4)
- [ ] Considerar code splitting para React
- [ ] Lazy load da imagem de fundo (opcional)

---

## 🔧 COMANDOS ÚTEIS

```bash
# Verificar tamanho do bundle
npm run build
Get-ChildItem dist\assets\*.js | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB, 2)}}

# Remover jimp
npm uninstall jimp

# Verificar se jimp está sendo usado
grep -r "jimp" src/ electron/
```

---

## 💡 OBSERVAÇÕES

1. **Jimp não está sendo usado** - Pode ser removido com segurança
2. **Delay de 3.5s é artificial** - Não reflete tempo real de carregamento
3. **Bibliotecas pesadas** podem ser carregadas sob demanda
4. **Fontes podem ser otimizadas** significativamente

---

**Relatório gerado em:** 30/12/2025  
**Próxima revisão:** Após implementar otimizações prioritárias
