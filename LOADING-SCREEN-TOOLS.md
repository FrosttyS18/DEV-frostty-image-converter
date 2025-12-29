# 🧩 Ferramentas de Loading Screen - MU Online

Scripts para editar facilmente as telas de carregamento do MU Online que vêm divididas em múltiplos arquivos OZJ.

## 📦 Instalação

Primeiro, instale a dependência necessária:

```bash
npm install
```

## 🔧 Como Usar

### Passo 1: Juntar as Peças (OZJ → Imagem Completa)

Use o script `merge-loading-screen.js` para converter todos os arquivos OZJ e montar a imagem completa:

```bash
node merge-loading-screen.js "C:\Users\adcka\Documents\MUS18\Data\Interface" "io_back_s5_im"
```

**Parâmetros:**
- `pasta`: Caminho da pasta com os arquivos OZJ
- `padrão` (opcional): Filtro para arquivos específicos (ex: "io_back_s5_im")

**Saída:**
- ✅ `io_back_s5_im_COMPLETO.png` - Imagem completa montada
- ✅ `io_back_s5_im_COMPLETO_layout.json` - Informações de layout (IMPORTANTE! Guarde este arquivo)

### Passo 2: Editar a Imagem

1. Abra `io_back_s5_im_COMPLETO.png` no Photoshop, GIMP ou outro editor
2. Faça suas edições
3. **IMPORTANTE:** Salve com o mesmo nome e mantenha as mesmas dimensões
4. Salve como PNG

### Passo 3: Dividir de Volta (Imagem → OZJ)

Use o script `split-loading-screen.js` para dividir sua imagem editada de volta nos arquivos OZJ:

```bash
node split-loading-screen.js io_back_s5_im_COMPLETO.png io_back_s5_im_COMPLETO_layout.json output-loading
```

**Parâmetros:**
- `imagem`: Sua imagem editada (.png)
- `layout`: Arquivo JSON com informações de layout
- `pasta-saida` (opcional): Onde salvar os OZJ (padrão: "output-loading")

**Saída:**
- 📁 Pasta com todos os arquivos OZJ novos prontos para usar!

### Passo 4: Aplicar no Jogo

1. Vá na pasta de saída (ex: `output-loading`)
2. Copie todos os arquivos `.OZJ`
3. Cole na pasta do MU Online: `C:\MU\Data\Interface` (substitua os originais)
4. **IMPORTANTE:** Faça backup dos arquivos originais antes!

## 📖 Exemplo Completo

```bash
# 1. Juntar peças
node merge-loading-screen.js "C:\MU\Data\Interface" "io_back_s5_im"

# 2. Editar io_back_s5_im_COMPLETO.png no Photoshop

# 3. Dividir de volta
node split-loading-screen.js io_back_s5_im_COMPLETO.png io_back_s5_im_COMPLETO_layout.json meu-loading

# 4. Copiar arquivos de meu-loading para C:\MU\Data\Interface
```

## 🎯 Diferentes Telas de Loading

O MU Online tem várias telas de carregamento. Padrões comuns:

- `io_back_s5_im` - Loading principal Season 5
- `io_back_s6_im` - Loading Season 6
- `login_back_im` - Tela de login
- `char_back_im` - Seleção de personagem

Para cada tela, repita o processo com o padrão correto.

## ⚠️ Avisos Importantes

1. **Sempre faça backup** dos arquivos originais antes de substituir
2. **Não modifique as dimensões** da imagem ao editar
3. **Guarde o arquivo `_layout.json`** - você precisa dele para dividir de volta
4. **Qualidade JPEG**: Os arquivos usam JPEG com qualidade 95% (boa qualidade)

## 🐛 Problemas Comuns

**"Nenhum arquivo OZJ encontrado"**
- Verifique o caminho da pasta
- Verifique o padrão de busca

**"Dimensões diferentes do original"**
- Você redimensionou a imagem editada
- Use as dimensões originais (informação no layout.json)

**"Arquivo de layout não encontrado"**
- Você precisa executar o `merge` antes do `split`
- Não apague o arquivo `_layout.json`

## 💡 Dicas

- Use PNG para editar (sem perda de qualidade)
- Os arquivos OZJ finais usam JPEG internamente
- Pode haver pequena perda de qualidade na conversão
- Teste sempre no jogo antes de distribuir

---

**Criado por:** DEV Frostty  
**Versão:** 1.0.0
