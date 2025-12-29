import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import CustomTitlebar from './components/CustomTitlebar';
import { useFileSelection } from './hooks/useFileSelection';
import { useConversion } from './hooks/useConversion';
import { ConversionType } from './types';

function App() {
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  
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
      
      {/* Toast de sucesso/erro */}
      {(successMessage || conversionError || fileError) && (
        <div className="fixed bottom-8 right-8 z-[10000] animate-fade-in">
          <div className={`glass rounded-2xl px-6 py-4 border ${
            successMessage ? 'border-green-500/50 bg-green-500/10' :
            'border-red-500/50 bg-red-500/10'
          }`}>
            <p className={`text-sm font-medium ${
              successMessage ? 'text-green-400' : 'text-red-400'
            }`}>
              {successMessage || conversionError || fileError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
