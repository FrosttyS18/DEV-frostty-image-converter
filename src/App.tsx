import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import CustomTitlebar from './components/CustomTitlebar';
import Toast from './components/Toast';
import { useFileSelection } from './hooks/useFileSelection';
import { useConversion } from './hooks/useConversion';
import { useGlowPointer } from './hooks/useGlowPointer';
import { electronService } from './services/electronService';
import { ConversionType } from './types';

function App() {
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  
  // Spotlight effect
  useGlowPointer();
  
  // Hooks customizados
  const { 
    selectedFiles, 
    isLoading: isLoadingFiles, 
    error: fileError, 
    selectFolder 
  } = useFileSelection();
  
  const { 
    isConverting, 
    error: conversionError, 
    successMessage,
    convert 
  } = useConversion();

  const handleConvert = async (type: ConversionType) => {
    console.log('[App] Iniciando conversão, tipo:', type);
    
    // Pergunta onde salvar
    console.log('[App] Abrindo seletor de pasta destino...');
    const outputFolder = await electronService.selectOutputFolder();
    
    console.log('[App] Pasta destino selecionada:', outputFolder);
    
    if (!outputFolder) {
      console.log('[App] Usuário cancelou seleção de pasta');
      return;
    }
    
    // Se tem arquivo no preview, converte APENAS ele
    if (currentPreview) {
      const fileToConvert = selectedFiles.find(f => f.path === currentPreview);
      console.log('[App] Convertendo arquivo do preview:', fileToConvert?.name);
      if (fileToConvert) {
        convert(type, [fileToConvert], outputFolder);
        return;
      }
    }
    
    // Senão, converte todos
    console.log('[App] Convertendo todos os arquivos:', selectedFiles.length);
    convert(type, selectedFiles, outputFolder);
  };

  // Controla toasts
  useEffect(() => {
    if (successMessage) setShowSuccessToast(true);
  }, [successMessage]);

  useEffect(() => {
    if (conversionError || fileError) setShowErrorToast(true);
  }, [conversionError, fileError]);

  return (
    <div className="relative w-screen h-screen overflow-hidden rounded-[14px] border border-white/5">
      {/* Barra de título customizada */}
      <CustomTitlebar />
      
      {/* Background com efeito */}
      <BackgroundEffect />
      
      {/* Container principal */}
      <div className="relative z-10 flex h-full pt-12 px-8 pb-8 gap-8">
        {/* Sidebar */}
        <Sidebar 
          selectedFiles={selectedFiles}
          onSelectFolder={selectFolder}
          onConvert={handleConvert}
          onFileSelect={setCurrentPreview}
          isConverting={isConverting}
          isLoadingFiles={isLoadingFiles}
        />
        
        {/* Canvas Visualizador */}
        <Canvas 
          currentPreview={currentPreview}
          selectedFiles={selectedFiles}
        />
      </div>
      
      {/* Toasts */}
      {showSuccessToast && successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessToast(false)}
          duration={3000}
        />
      )}
      
      {showErrorToast && (conversionError || fileError) && (
        <Toast
          message={conversionError || fileError || ''}
          type="error"
          onClose={() => setShowErrorToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
}

export default App;
