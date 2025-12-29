using System;
using System.Runtime.InteropServices;
using System.IO;

class OzdConverter
{
    // Importa funcoes da DLL ozd.dll
    // Tentando assinaturas comuns
    
    [DllImport("ozd.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int Convert(string input, string output);
    
    [DllImport("ozd.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int Decrypt(byte[] input, int size, byte[] output);
    
    [DllImport("ozd.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int DecryptFile(string inputPath, string outputPath);
    
    static void Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Uso: OzdConverter.exe <input.ozd> <output.dds>");
            return;
        }
        
        string inputPath = args[0];
        string outputPath = args[1];
        
        // Define caminho da DLL
        string dllPath = Path.Combine(
            Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location),
            "arquivos para estudar o formato",
            "arquivos enviado pelo nosso amigo"
        );
        
        Environment.SetEnvironmentVariable("PATH", 
            Environment.GetEnvironmentVariable("PATH") + ";" + dllPath);
        
        Console.WriteLine($"Convertendo: {inputPath} -> {outputPath}");
        
        try
        {
            // Tenta metodo 1: DecryptFile
            try
            {
                int result = DecryptFile(inputPath, outputPath);
                if (result == 0 && File.Exists(outputPath))
                {
                    Console.WriteLine("SUCESSO via DecryptFile!");
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DecryptFile falhou: {ex.Message}");
            }
            
            // Tenta metodo 2: Convert
            try
            {
                int result = Convert(inputPath, outputPath);
                if (result == 0 && File.Exists(outputPath))
                {
                    Console.WriteLine("SUCESSO via Convert!");
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Convert falhou: {ex.Message}");
            }
            
            // Tenta metodo 3: Decrypt com buffer
            try
            {
                byte[] inputData = File.ReadAllBytes(inputPath);
                byte[] outputData = new byte[inputData.Length * 2]; // Buffer maior por seguranca
                
                int result = Decrypt(inputData, inputData.Length, outputData);
                if (result > 0)
                {
                    File.WriteAllBytes(outputPath, outputData.Take(result).ToArray());
                    Console.WriteLine("SUCESSO via Decrypt!");
                    return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Decrypt falhou: {ex.Message}");
            }
            
            Console.WriteLine("ERRO: Nenhum metodo funcionou");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERRO GERAL: {ex.Message}");
        }
    }
}
