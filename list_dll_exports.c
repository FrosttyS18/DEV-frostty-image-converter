#include <stdio.h>
#include <windows.h>
#include <winnt.h>

int main(int argc, char *argv[]) {
    printf("===================================\n");
    printf("LISTANDO FUNCOES EXPORTADAS DA DLL\n");
    printf("===================================\n\n");
    
    // Caminho da DLL
    char dllPath[1024];
    char exePath[1024];
    
    GetModuleFileName(NULL, exePath, sizeof(exePath));
    char *lastSlash = strrchr(exePath, '\\');
    if (lastSlash) *lastSlash = '\0';
    
    snprintf(dllPath, sizeof(dllPath), 
             "%s\\arquivos para estudar o formato\\arquivos enviado pelo nosso amigo\\ozd.dll",
             exePath);
    
    printf("DLL: %s\n\n", dllPath);
    
    // Carrega a DLL
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO ao carregar DLL!\n");
        return 1;
    }
    
    printf("DLL carregada!\n\n");
    
    // Pega o base address
    PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)hDll;
    PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)((BYTE*)hDll + dosHeader->e_lfanew);
    
    // Pega o export directory
    DWORD exportDirRVA = ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    
    if (exportDirRVA == 0) {
        printf("DLL nao tem funcoes exportadas (ou esta stripped)\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    IMAGE_EXPORT_DIRECTORY *exportDir = (IMAGE_EXPORT_DIRECTORY*)((BYTE*)hDll + exportDirRVA);
    
    DWORD *nameRVAs = (DWORD*)((BYTE*)hDll + exportDir->AddressOfNames);
    WORD *ordinals = (WORD*)((BYTE*)hDll + exportDir->AddressOfNameOrdinals);
    DWORD *functionRVAs = (DWORD*)((BYTE*)hDll + exportDir->AddressOfFunctions);
    
    printf("Funcoes exportadas: %lu\n", exportDir->NumberOfNames);
    printf("===================================\n\n");
    
    for (DWORD i = 0; i < exportDir->NumberOfNames; i++) {
        const char *name = (const char*)((BYTE*)hDll + nameRVAs[i]);
        WORD ordinal = ordinals[i];
        DWORD funcRVA = functionRVAs[ordinal];
        
        printf("%3lu. %s (Ordinal: %u, RVA: 0x%08lX)\n", i + 1, name, ordinal, funcRVA);
    }
    
    printf("\n===================================\n");
    
    FreeLibrary(hDll);
    return 0;
}
