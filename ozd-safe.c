#include <stdio.h>
#include <stdlib.h>
#include <windows.h>
#include <string.h>

// Callback de exceção
LONG WINAPI ExceptionHandler(EXCEPTION_POINTERS* ExceptionInfo) {
    printf("CRASH detectado! Codigo: 0x%lx\n", ExceptionInfo->ExceptionRecord->ExceptionCode);
    return EXCEPTION_EXECUTE_HANDLER;
}

int main(int argc, char* argv[]) {
    // Instala handler de exceção
    SetUnhandledExceptionFilter(ExceptionHandler);
    
    if (argc < 3) {
        printf("Uso: ozd-safe.exe <input.ozd> <output.dds>\n");
        return 1;
    }
    
    const char* inputPath = argv[1];
    const char* outputPath = argv[2];
    
    // Converte para caminhos absolutos
    char absInput[MAX_PATH];
    char absOutput[MAX_PATH];
    GetFullPathNameA(inputPath, MAX_PATH, absInput, NULL);
    GetFullPathNameA(outputPath, MAX_PATH, absOutput, NULL);
    
    printf("Input:  %s\n", absInput);
    printf("Output: %s\n\n", absOutput);
    
    // Carrega DLL
    char exePath[MAX_PATH];
    char dllPath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char* lastSlash = strrchr(exePath, '\\');
    if (lastSlash) *lastSlash = '\0';
    snprintf(dllPath, MAX_PATH, "%s\\ozd.dll", exePath);
    
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO: Nao foi possivel carregar DLL\n");
        return 1;
    }
    
    void* pOpenImage = GetProcAddress(hDll, "OpenImage");
    if (!pOpenImage) {
        printf("ERRO: OpenImage nao encontrada\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    printf("DLL carregada!\n\n");
    
    // Tenta apenas com 2 parâmetros e código de retorno 0 = sucesso
    printf("Chamando: OpenImage(\"%s\", \"%s\")\n", absInput, absOutput);
    
    typedef int (*OpenImageFunc)(const char*, const char*);
    OpenImageFunc OpenImage = (OpenImageFunc)pOpenImage;
    
    int result = OpenImage(absInput, absOutput);
    printf("Retornou: %d\n", result);
    
    // Verifica se criou arquivo independente do retorno
    Sleep(100); // Aguarda um pouco
    FILE* test = fopen(absOutput, "rb");
    if (test) {
        fseek(test, 0, SEEK_END);
        long size = ftell(test);
        fclose(test);
        
        if (size > 0) {
            printf("\n[SUCESSO] Arquivo DDS criado! (%ld bytes)\n", size);
            
            // Verifica se é DDS válido (magic number "DDS ")
            test = fopen(absOutput, "rb");
            char magic[4];
            fread(magic, 1, 4, test);
            fclose(test);
            
            if (magic[0] == 'D' && magic[1] == 'D' && magic[2] == 'S' && magic[3] == ' ') {
                printf("Arquivo DDS valido!\n");
            } else {
                printf("AVISO: Arquivo criado mas pode nao ser DDS valido\n");
            }
            
            FreeLibrary(hDll);
            return 0;
        }
    }
    
    printf("Arquivo nao foi criado (codigo retorno: %d)\n", result);
    
    FreeLibrary(hDll);
    return 1;
}
