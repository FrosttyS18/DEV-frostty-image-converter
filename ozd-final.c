#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-final.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    const char* inputPath = argv[1];
    const char* outputPath = argv[2];
    
    printf("Input:  %s\n", inputPath);
    printf("Output: %s\n\n", outputPath);
    
    // Pega o diretório do executável
    char exePath[MAX_PATH];
    char dllPath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char* lastSlash = strrchr(exePath, '\\');
    if (lastSlash) *lastSlash = '\0';
    snprintf(dllPath, MAX_PATH, "%s\\ozd.dll", exePath);
    
    // Carrega DLL
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO: Nao foi possivel carregar DLL\n");
        return 1;
    }
    printf("DLL carregada!\n");
    
    // Pega funcoes
    void* pOpenImage = GetProcAddress(hDll, "OpenImage");
    void* pSaveImage = GetProcAddress(hDll, "SaveImage");
    
    if (!pOpenImage || !pSaveImage) {
        printf("ERRO: Funcoes nao encontradas\n");
        FreeLibrary(hDll);
        return 1;
    }
    printf("Funcoes encontradas!\n\n");
    
    // Assinatura mais comum: int OpenImage(const char* input, const char* output)
    printf("Tentando: OpenImage(input, output)...\n");
    typedef int (*OpenImageFunc)(const char*, const char*);
    OpenImageFunc OpenImage = (OpenImageFunc)pOpenImage;
    
    int result = OpenImage(inputPath, outputPath);
    printf("Resultado: %d\n", result);
    
    // Verifica se criou o arquivo
    FILE* test = fopen(outputPath, "rb");
    if (test) {
        fseek(test, 0, SEEK_END);
        long size = ftell(test);
        fclose(test);
        printf("\n[SUCESSO] Arquivo DDS criado! (%ld bytes)\n", size);
        FreeLibrary(hDll);
        return 0;
    }
    
    printf("\nArquivo nao foi criado. A funcao pode precisar de parametros diferentes.\n");
    FreeLibrary(hDll);
    return 1;
}
