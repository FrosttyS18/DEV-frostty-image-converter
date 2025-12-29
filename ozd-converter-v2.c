/*
 * Wrapper OZD - Versao 2
 * Testa multiplas assinaturas de OpenImage
 */

#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-converter-v2.exe <input.ozd> <output.dds>\n");
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
    
    // Remove o nome do executável para ficar só o diretório
    char* lastSlash = strrchr(exePath, '\\');
    if (lastSlash) {
        *lastSlash = '\0';
    }
    
    // Constrói o caminho completo da DLL
    snprintf(dllPath, MAX_PATH, "%s\\ozd.dll", exePath);
    printf("Tentando carregar DLL: %s\n", dllPath);
    
    // Carrega DLL usando caminho absoluto
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        // Tenta caminho alternativo
        snprintf(dllPath, MAX_PATH, "%s\\arquivos para estudar o formato\\arquivos enviado pelo nosso amigo\\ozd.dll", exePath);
        printf("Tentando caminho alternativo: %s\n", dllPath);
        hDll = LoadLibraryA(dllPath);
    }
    if (!hDll) {
        printf("ERRO: Nao foi possivel carregar DLL ozd.dll\n");
        printf("Certifique-se que ozd.dll esta na mesma pasta do executavel\n");
        return 1;
    }
    
    printf("DLL carregada!\n\n");
    
    // Pega funcoes
    void* pOpenImage = GetProcAddress(hDll, "OpenImage");
    void* pSaveImage = GetProcAddress(hDll, "SaveImage");
    
    if (!pOpenImage) {
        printf("ERRO: OpenImage nao encontrada\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    printf("OpenImage encontrada!\n\n");
    
    // Testa diferentes assinaturas
    printf("TESTE 1: OpenImage(input) -> retorna ponteiro\n");
    typedef void* (*OpenImageFunc1)(const char*);
    OpenImageFunc1 OpenImage1 = (OpenImageFunc1)pOpenImage;
    void* imageData = OpenImage1(inputPath);
    printf("  Resultado: %p\n", imageData);
    
    if (imageData && pSaveImage) {
        printf("\nTESTE 2: SaveImage(imageData, output)\n");
        typedef int (*SaveImageFunc1)(void*, const char*);
        SaveImageFunc1 SaveImage1 = (SaveImageFunc1)pSaveImage;
        int result = SaveImage1(imageData, outputPath);
        printf("  Resultado: %d\n", result);
        
        // Verifica se criou arquivo
        FILE* test = fopen(outputPath, "rb");
        if (test) {
            fclose(test);
            printf("\n[SUCESSO] Arquivo DDS criado!\n");
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    printf("\nTESTE 3: OpenImage(input, output)\n");
    typedef int (*OpenImageFunc2)(const char*, const char*);
    OpenImageFunc2 OpenImage2 = (OpenImageFunc2)pOpenImage;
    int result = OpenImage2(inputPath, outputPath);
    printf("  Resultado: %d\n", result);
    
    FILE* test = fopen(outputPath, "rb");
    if (test) {
        fclose(test);
        printf("\n[SUCESSO] Arquivo DDS criado!\n");
        FreeLibrary(hDll);
        return 0;
    }
    
    printf("\n[ERRO] Nenhuma assinatura funcionou\n");
    FreeLibrary(hDll);
    return 1;
}
