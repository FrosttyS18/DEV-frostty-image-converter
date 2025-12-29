import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import CustomTitlebar from './components/CustomTitlebar';
import Toast from './components/Toast';
import { useFileSelection } from './hooks/useFileSelection';
import { useConversion } from './hooks/useConversion';
import { useGlowPointer } from './hooks/useGlowPointer';
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

  const handleConvert = (type: ConversionType) => {
    convert(type, selectedFiles);
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
