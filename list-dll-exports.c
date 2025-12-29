/*
 * Lista todas as funcoes exportadas pela DLL
 */

#include <stdio.h>
#include <windows.h>
#include <winnt.h>

int main(int argc, char* argv[]) {
    const char* dllPath = "arquivos para estudar o formato\\arquivos enviado pelo nosso amigo\\ozd.dll";
    
    printf("===============================================================\n");
    printf("LISTANDO FUNCOES EXPORTADAS DA DLL\n");
    printf("===============================================================\n");
    printf("DLL: %s\n\n", dllPath);
    
    // Carrega a DLL
    HMODULE hDll = LoadLibraryA(dllPath);
    if (!hDll) {
        printf("ERRO: Nao foi possivel carregar a DLL\n");
        return 1;
    }
    
    printf("DLL carregada com sucesso!\n\n");
    
    // Pega base da DLL
    BYTE* baseAddr = (BYTE*)hDll;
    
    // Le header PE
    IMAGE_DOS_HEADER* dosHeader = (IMAGE_DOS_HEADER*)baseAddr;
    IMAGE_NT_HEADERS* ntHeaders = (IMAGE_NT_HEADERS*)(baseAddr + dosHeader->e_lfanew);
    
    // Pega diretorio de exports
    DWORD exportDirRVA = ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress;
    
    if (exportDirRVA == 0) {
        printf("ERRO: DLL nao tem exports\n");
        FreeLibrary(hDll);
        return 1;
    }
    
    IMAGE_EXPORT_DIRECTORY* exportDir = (IMAGE_EXPORT_DIRECTORY*)(baseAddr + exportDirRVA);
    
    DWORD* nameRVAs = (DWORD*)(baseAddr + exportDir->AddressOfNames);
    WORD* ordinals = (WORD*)(baseAddr + exportDir->AddressOfNameOrdinals);
    DWORD* funcRVAs = (DWORD*)(baseAddr + exportDir->AddressOfFunctions);
    
    printf("FUNCOES EXPORTADAS (%lu funcoes):\n", exportDir->NumberOfNames);
    printf("---------------------------------------------------------------\n");
    
    for (DWORD i = 0; i < exportDir->NumberOfNames; i++) {
        const char* funcName = (const char*)(baseAddr + nameRVAs[i]);
        WORD ordinal = ordinals[i];
        DWORD funcRVA = funcRVAs[ordinal];
        
        printf("%3lu. %s (ordinal: %d, RVA: 0x%08lX)\n", 
               i + 1, funcName, ordinal, funcRVA);
    }
    
    printf("\n===============================================================\n");
    
    FreeLibrary(hDll);
    return 0;
}
