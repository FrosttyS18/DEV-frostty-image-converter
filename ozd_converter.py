#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Wrapper para ozd.dll (32-bit)
Converte OZD <-> DDS usando a DLL fornecida
"""

import ctypes
import os
import sys

def convert_ozd_to_dds(ozd_path, dds_path):
    """Converte OZD para DDS usando ozd.dll"""
    
    # Caminho da DLL
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dll_path = os.path.join(script_dir, 'arquivos para estudar o formato', 
                            'arquivos enviado pelo nosso amigo', 'ozd.dll')
    
    if not os.path.exists(dll_path):
        print(f"ERRO: DLL nao encontrada em {dll_path}")
        return False
    
    if not os.path.exists(ozd_path):
        print(f"ERRO: Arquivo OZD nao encontrado: {ozd_path}")
        return False
    
    try:
        # Carrega a DLL
        ozd_dll = ctypes.CDLL(dll_path)
        
        # Tenta diferentes assinaturas de funcao
        # Assinatura 1: ImagenConvert(char* input, char* output)
        try:
            ImagenConvert = ozd_dll.ImagenConvert
            ImagenConvert.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
            ImagenConvert.restype = ctypes.c_int
            
            result = ImagenConvert(ozd_path.encode('utf-8'), dds_path.encode('utf-8'))
            
            if os.path.exists(dds_path):
                print(f"SUCESSO! Arquivo convertido: {dds_path}")
                return True
            
        except Exception as e:
            print(f"ImagenConvert metodo 1 falhou: {e}")
        
        # Assinatura 2: ConvertFile(char* input, char* output, int tipo)
        try:
            ConvertFile = ozd_dll.ConvertFile
            ConvertFile.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_int]
            ConvertFile.restype = ctypes.c_int
            
            result = ConvertFile(ozd_path.encode('utf-8'), dds_path.encode('utf-8'), 2) # 2 = OZD
            
            if os.path.exists(dds_path):
                print(f"SUCESSO! Arquivo convertido: {dds_path}")
                return True
                
        except Exception as e:
            print(f"ConvertFile falhou: {e}")
        
        # Assinatura 3: Descriptografar buffer
        try:
            with open(ozd_path, 'rb') as f:
                ozd_data = f.read()
            
            input_buffer = ctypes.create_string_buffer(ozd_data)
            output_buffer = ctypes.create_string_buffer(len(ozd_data) * 2)
            
            DecryptBuffer = ozd_dll.DecryptBuffer
            DecryptBuffer.argtypes = [ctypes.POINTER(ctypes.c_char), ctypes.c_int, 
                                     ctypes.POINTER(ctypes.c_char)]
            DecryptBuffer.restype = ctypes.c_int
            
            size = DecryptBuffer(input_buffer, len(ozd_data), output_buffer)
            
            if size > 0:
                with open(dds_path, 'wb') as f:
                    f.write(output_buffer.raw[:size])
                print(f"SUCESSO! Arquivo convertido: {dds_path}")
                return True
                
        except Exception as e:
            print(f"DecryptBuffer falhou: {e}")
        
        print("ERRO: Nenhuma assinatura de funcao funcionou")
        return False
        
    except Exception as e:
        print(f"ERRO ao carregar DLL: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python ozd_converter.py <input.ozd> <output.dds>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    success = convert_ozd_to_dds(input_file, output_file)
    sys.exit(0 if success else 1)
