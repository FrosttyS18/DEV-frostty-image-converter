#include <stdio.h>
#include <stdlib.h>
#include <windows.h>

int main(int argc, char* argv[]) {
    if (argc < 3) {
        printf("Uso: ozd-simple-test.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    // Pega o diretório do executável
    char exePath[MAX_PATH];
    char dllPath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char* lastSlash = strrchr(exePath, '\\');
    if (lastSlash) *lastSlash = '\0';
    snprintf(dllPath, MAX_PATH, "%s\\ozd.dll", exePath);
    
    printf("Carregando DLL: %s\n", dllPath);
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO: Nao foi possivel carregar DLL (codigo: %d)\n", GetLastError());
        return 1;
    }
    printf("DLL carregada com sucesso!\n\n");
    
    // Lista todas as funções exportadas que começam com "Open" ou "Save" ou "Convert"
    printf("Procurando funcoes...\n");
    
    void* pFunc = NULL;
    
    // Tenta diferentes nomes de funções
    const char* funcNames[] = {
        "OpenImage",
        "SaveImage", 
        "ConvertOZD",
        "ConvertOZDToDDS",
        "Convert",
        "LoadOZD",
        "SaveDDS",
        NULL
    };
    
    for (int i = 0; funcNames[i] != NULL; i++) {
        pFunc = GetProcAddress(hDll, funcNames[i]);
        if (pFunc) {
            printf("  [OK] %s encontrada em %p\n", funcNames[i], pFunc);
        } else {
            printf("  [ ] %s nao encontrada\n", funcNames[i]);
        }
    }
    
    FreeLibrary(hDll);
    printf("\nTeste concluido!\n");
    return 0;
}
