const BackgroundEffect = () => {
  return (
    <>
      {/* Background base */}
      <div className="absolute inset-0 bg-gradient-to-br from-frostty-dark via-purple-950 to-blue-950 rounded-[14px]" />
      
      {/* Efeito de blur roxo/azul (similar ao webp que você mandou) - OTIMIZADO para GPU */}
      <div className="absolute inset-0 overflow-hidden rounded-[14px]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-frostty-purple rounded-full mix-blend-normal filter blur-[40px] opacity-30" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-normal filter blur-[50px] opacity-20" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-purple-500 rounded-full mix-blend-normal filter blur-[45px] opacity-25" />
      </div>
      
      {/* Overlay escuro para melhor contraste */}
      <div className="absolute inset-0 bg-black opacity-20 rounded-[14px]" />
    </>
  );
};

export default BackgroundEffect;
