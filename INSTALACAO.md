# 📦 Guia de Instalação - DEV Frostty Image Converter

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### Node.js (obrigatório)
- **Versão**: 18.0 ou superior
- **Download**: https://nodejs.org/
- **Verificar instalação**:
  ```bash
  node --version
  npm --version
  ```

### Git (opcional, mas recomendado)
- **Download**: https://git-scm.com/

## 🚀 Instalação

### Método 1: Via Git (Recomendado)

```bash
# 1. Clonar repositório
git clone [seu-repositorio]
cd App-mu

# 2. Instalar dependências
npm install

# 3. Executar aplicação
npm run dev
```

### Método 2: Download Manual

```bash
# 1. Baixe o ZIP do projeto e extraia
# 2. Abra o terminal na pasta extraída
# 3. Execute:
npm install
npm run dev
```

## 🎯 Primeiro Uso

1. **Aguarde a instalação** das dependências (primeira vez demora ~1-2 minutos)

2. **Execute o comando**:
   ```bash
   npm run dev
   ```

3. **Duas janelas abrirão**:
   - Terminal com log do Vite (pode minimizar)
   - Janela do Electron com a aplicação

4. **Teste básico**:
   - Clique em "Selecionar Pasta"
   - Escolha a pasta `arquivos para estudar o formato`
   - Clique em um arquivo da lista
   - Veja o preview aparecer no canvas

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Build de produção
npm run build

# Gerar executável standalone
npm run electron:build

# Apenas frontend (sem Electron)
npm run dev:vite
```

## 📁 Estrutura de Pastas

```
App-mu/
├── electron/                      # Código do Electron
├── src/                          # Código React
│   ├── components/               # Componentes UI
│   ├── utils/                    # Conversores
│   └── ...
├── arquivos para estudar o formato/  # Arquivos de teste
├── public/                       # Assets públicos
├── package.json                  # Dependências
└── README.md                     # Documentação
```

## ⚙️ Configuração (Opcional)

### Ajustar Porta do Vite

Edite `vite.config.ts`:

```typescript
server: {
  port: 5173, // Altere aqui
},
```

### Ajustar Tamanho da Janela

Edite `electron/main.js`:

```javascript
width: 1400,  // Largura
height: 900,  // Altura
```

## 🐛 Problemas Comuns

### Erro: "node não é reconhecido"
**Solução**: Instale o Node.js e reinicie o terminal

### Erro: "npm install falha"
**Solução**: 
```bash
# Limpe o cache
npm cache clean --force
# Tente novamente
npm install
```

### Erro: "Electron não abre"
**Solução**:
```bash
# Reinstale o Electron
npm install electron --save-dev
```

### Erro: "Cannot find module"
**Solução**:
```bash
# Reinstale tudo
rm -rf node_modules
npm install
```

### Aviso: "deprecated packages"
**Solução**: Não se preocupe, são warnings normais de dependências

## 🎨 Personalização

### Cores do Tema

Edite `tailwind.config.cjs`:

```javascript
colors: {
  'frostty-purple': '#7B3FF2',  // Roxo principal
  'frostty-blue': '#4F46E5',    // Azul
  'frostty-dark': '#0A0A0F',    // Fundo escuro
},
```

### Logo

Edite `src/components/Logo.tsx` para customizar o logo

## 📊 Requisitos de Sistema

| Item | Mínimo | Recomendado |
|------|--------|-------------|
| **OS** | Windows 10 | Windows 11 |
| **RAM** | 4 GB | 8 GB+ |
| **Espaço** | 500 MB | 1 GB |
| **Node.js** | 18.0 | 20.0+ |

## 🔄 Atualização

```bash
# Puxar últimas alterações (se usando Git)
git pull

# Reinstalar dependências
npm install

# Executar
npm run dev
```

## 📦 Gerar Executável

Para distribuir o app:

```bash
# Build
npm run electron:build
```

O executável estará em `dist/` ou `release/`

## 💡 Dicas

✅ **Mantenha o Node.js atualizado**
✅ **Use terminal com permissões administrativas se houver erros**
✅ **Verifique antivírus** (pode bloquear Electron)
✅ **Feche outras aplicações** durante o desenvolvimento

## 🆘 Suporte

Se nada funcionar:

1. **Delete tudo e comece de novo**:
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

2. **Verifique versões**:
   ```bash
   node --version  # Deve ser 18+
   npm --version   # Deve ser 9+
   ```

3. **Reinstale Node.js** do zero

## 📞 Contato

- **Issues**: [GitHub Issues]
- **Discord**: [Seu Discord]
- **Email**: [Seu Email]

---

**Boa sorte e bom desenvolvimento! 💜**
