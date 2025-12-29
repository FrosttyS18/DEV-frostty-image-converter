import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import BackgroundEffect from './components/BackgroundEffect';
import { FileInfo } from './types';

function App() {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Background com efeito */}
      <BackgroundEffect />
      
      {/* Container principal */}
      <div className="relative z-10 flex h-full p-6 gap-6">
        {/* Sidebar */}
        <Sidebar 
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          setCurrentPreview={setCurrentPreview}
          isConverting={isConverting}
          setIsConverting={setIsConverting}
        />
        
        {/* Canvas Visualizador */}
        <Canvas 
          currentPreview={currentPreview}
          selectedFiles={selectedFiles}
        />
      </div>
    </div>
  );
}

export default App;
