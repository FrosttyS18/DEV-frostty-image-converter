# Guia Rapido - DEV Frostty Image Converter

## Inicio Rapido (3 passos)

### 1. Selecionar Pasta
```
Clique em "Selecionar Pasta"
   ↓
Escolha: C:\MU\Data\Interface
   ↓
Lista de arquivos carrega automaticamente
```

### 2. Selecionar Arquivo
```
Clique no arquivo desejado
   ↓
Preview aparece no canvas ao lado
   ↓
Veja dimensoes e informacoes
```

### 3. Converter
```
Clique com BOTAO DIREITO no arquivo
   ↓
Menu mostra conversoes validas
   ↓
Clique na conversao desejada
   ↓
Escolha pasta de destino
   ↓
Pronto!
```

## Conversoes Mais Comuns

### Extrair textura do jogo para editar

```
Arquivo no jogo: item.ozt

OZT → TGA (menu contextual)
   ↓
Abre item.tga no Photoshop
   ↓
Edita a textura
   ↓
Salva como PNG
```

### Criar textura nova para o jogo

```
Cria imagem no Photoshop (PNG, 512x512)
   ↓
Salva como item_novo.png
   ↓
Seleciona pasta com PNG
   ↓
PNG → OZT (menu contextual)
   ↓
Copia item_novo.ozt para C:\MU\Data\Interface
```

### Extrair imagem de loading screen

```
Arquivo no jogo: lo_back_s5_im01.OZJ

OZJ → JPG (menu contextual)
   ↓
Abre lo_back_s5_im01.jpg
```

## Atalhos e Dicas

### Menu Contextual
- **Botao direito** no arquivo = Menu de conversoes
- Opcoes invalidas aparecem desabilitadas
- Apenas conversoes validas clicaveis

### Preview
- **Clique no arquivo** = Mostra preview automaticamente
- Preview em tempo real no canvas
- Dimensoes e informacoes exibidas

### Performance
- Lazy loading automatico de thumbnails
- Apenas 10-15 thumbs carregam inicialmente
- Scroll carrega mais thumbnails sob demanda
- Arquivos > 5MB nao geram thumbnail (icone apenas)

## Estrutura de Pastas do MU

```
MU Online/
├── Data/
│   ├── Interface/     # Arquivos OZT, OZJ (UI, items, icons)
│   ├── Texture/       # Arquivos OZT (texturas de terreno)
│   ├── Player/        # Arquivos OZT (modelos de personagem)
│   └── Skill/         # Arquivos OZT (efeitos de skill)
```

## Formatos Explicados

| Formato | O que e | Onde usar |
|---------|---------|-----------|
| **PNG** | Imagem padrao | Edicao (Photoshop/GIMP) |
| **TGA** | Targa (32-bit) | Intermediario, edicao |
| **OZT** | TGA + Zlib | Texturas do MU (formato final) |
| **OZJ** | JPEG (+XOR) | Imagens JPEG do MU |

## Casos de Uso

### Caso 1: Mudar cor de um item

```
1. Encontra arquivo: Sword.ozt
2. Botao direito → OZT → TGA
3. Abre Sword.tga no Photoshop
4. Ajusta cor/saturacao
5. Salva como Sword_novo.png
6. Botao direito → PNG → OZT
7. Renomeia para Sword.ozt
8. Substitui no MU
```

### Caso 2: Criar icon customizado

```
1. Desenha icon 32x32 no Photoshop
2. Salva como icon_custom.png (com transparencia)
3. Coloca PNG na pasta do conversor
4. Seleciona pasta
5. Botao direito no PNG → PNG → OZT
6. Copia icon_custom.ozt para C:\MU\Data\Interface
7. Edita ItemList.bmd para usar o novo icon
```

### Caso 3: Editar tela de loading

```
1. Converte 6 pecas: lo_back_s5_im01-06.OZJ → JPG
2. Monta imagem completa no Photoshop
3. Edita a imagem
4. Divide de volta em 6 pecas
5. Converte cada peca de volta para OZJ
6. Substitui no MU
```

Use os scripts `merge-loading-screen.js` e `split-loading-screen.js` para automatizar.

## Dicas Importantes

### Canal Alpha (Transparencia)
- SEMPRE preservar canal alpha em texturas de UI
- Use PNG-32 (com alpha) ao editar
- Nao achate a imagem ao salvar
- Teste no jogo antes de distribuir

### Dimensoes
- Items: geralmente 32x32 ou 64x64
- Interface: variam (128x128, 256x256, 512x512)
- Loading screens: muito grandes (varios MB)

### Organizacao
- Mantenha backup dos arquivos originais
- Crie pastas separadas para suas texturas
- Documente mudancas feitas

## Solucao Rapida de Problemas

| Problema | Solucao |
|----------|---------|
| Preview nao aparece | Arquivo > 5MB ou corrompido |
| Conversao falha | Tipo invalido ou arquivo corrompido |
| Menu nao abre | Clique com botao DIREITO |
| Opcao desabilitada | Conversao invalida para esse formato |

## Performance

O conversor foi otimizado para:
- Pastas com 1000+ arquivos
- Lazy loading de thumbnails
- Limite de 5MB para thumbnails
- Memoria controlada
- Cleanup automatico

## Proximos Passos

1. Leia `LOADING-SCREEN-TOOLS.md` para ferramentas de loading screen
2. Veja exemplos em `arquivos para estudar o formato/`
3. Teste com arquivos pequenos primeiro
4. Sempre faça backup!

---

**DEV Frostty** - Season 18 Tools  
Desenvolvido para a comunidade Mu Online
