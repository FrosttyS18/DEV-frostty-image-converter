import ctypes
import os
import sys

print("=" * 80)
print("TESTE: Carregando ozd.dll com Python ctypes")
print("=" * 80)

dll_path = os.path.join(os.path.dirname(__file__), 
    'arquivos para estudar o formato', 'arquivos enviado pelo nosso amigo', 'ozd.dll')

print(f"\nDLL Path: {dll_path}")
print(f"DLL existe? {os.path.exists(dll_path)}")

if os.path.exists(dll_path):
    try:
        # Carrega a DLL
        ozd_dll = ctypes.CDLL(dll_path)
        print("\nDLL carregada com sucesso!")
        
        # Tenta descobrir funcoes exportadas
        # Funcoes comuns em DLLs de conversao:
        possible_functions = [
            'Convert', 'Decrypt', 'Encode', 'Decode',
            'ProcessFile', 'TransformFile', 'OZDToDDS', 'DDSToOZD',
            'ConvertOZD', 'DecryptOZD', 'EncryptDDS'
        ]
        
        print("\nProcurando funcoes exportadas...")
        found_functions = []
        
        for func_name in possible_functions:
            try:
                func = getattr(ozd_dll, func_name)
                found_functions.append(func_name)
                print(f"  Encontrada: {func_name}")
            except AttributeError:
                pass
        
        if not found_functions:
            print("  Nenhuma funcao comum encontrada")
            print("\nTentando chamar funcao generica...")
            
            # Testa arquivo
            test_ozd = os.path.join(os.path.dirname(__file__), 
                'arquivos para estudar o formato', 'bg_3_1.ozd')
            test_out = os.path.join(os.path.dirname(__file__), 'test-output-python.dds')
            
            print(f"\nArquivo teste: {test_ozd}")
            print(f"Output: {test_out}")
            
    except Exception as e:
        print(f"\nErro ao carregar DLL: {e}")
        print("\nA DLL pode requerer dependencias ou ter arquitetura incompativel")

print("\n" + "=" * 80)
