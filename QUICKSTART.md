# 🚀 Quick Start Guide

## Instalação Rápida

```bash
# 1. Instalar dependências
npm install

# 2. Executar aplicação
npm run dev
```

## Primeira Execução

1. Aguarde o Electron abrir (pode demorar alguns segundos na primeira vez)
2. A janela abrirá automaticamente com a interface DEU Frostty
3. Clique em "Selecionar Pasta" e escolha a pasta com arquivos do Mu

## Comandos Disponíveis

```bash
# Desenvolvimento (hot-reload)
npm run dev

# Build de produção
npm run build

# Gerar executável
npm run electron:build

# Preview do build
npm run preview
```

## Estrutura de Pastas Recomendada

```
Mu Online/
├── Data/          # Arquivos do cliente
│   ├── Interface/ # Arquivos OZT/OZB
│   └── Textures/  # Arquivos OZT/TGA
└── Edited/        # Suas edições (criar esta pasta)
```

## Workflow Recomendado

### Para Editar Texturas Existentes

1. **Extrair**: Selecione a pasta `Data/Interface`
2. **Converter**: OZT → PNG
3. **Editar**: Abra o PNG no Photoshop/GIMP
4. **Salvar**: Salve mantendo transparência
5. **Reconverter**: PNG → OZT
6. **Testar**: Copie o OZT de volta para a pasta do jogo

### Para Criar Novas Texturas

1. **Criar**: Faça a imagem em PNG (1024x1024 ou menor)
2. **Adicionar Alpha**: Certifique-se de ter canal alpha se precisar transparência
3. **Converter**: PNG → OZT
4. **Usar**: Coloque no cliente do Mu

## Dicas Importantes

✅ **Sempre mantenha backups** dos arquivos originais
✅ **Preserve o canal alpha** (transparência)
✅ **Use PNG com 32-bit** (RGBA) para melhores resultados
✅ **Teste no jogo** antes de distribuir

⚠️ **Evite**:
- Salvar PNG em 24-bit (perde alpha)
- Usar JPEG (sem transparência)
- Editar dimensões sem necessidade

## Troubleshooting Rápido

### Aplicação não abre
```bash
# Limpe e reinstale
rm -rf node_modules
npm install
npm run dev
```

### Erro ao converter
- Verifique se o arquivo não está aberto em outro programa
- Confirme que você tem permissão de escrita na pasta
- Tente converter um arquivo por vez primeiro

### Preview não aparece
- Aguarde alguns segundos (arquivos grandes demoram)
- Verifique se o formato é suportado
- Pressione F12 e veja erros no console

## Atalhos de Teclado (futuro)

| Atalho | Ação |
|--------|------|
| Ctrl+O | Abrir pasta |
| Ctrl+R | Recarregar lista |
| F5 | Atualizar preview |
| F12 | DevTools |

## Suporte

- GitHub Issues: [seu-repo]/issues
- Discord: [seu-discord]
- Email: [seu-email]

---

**Happy Converting! 💜**
