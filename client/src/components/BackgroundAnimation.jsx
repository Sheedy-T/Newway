const BackgroundAnimation = ({ children }) => {
  return (
    <div className="relative w-full h-screen ">
      
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat animate-changeBg z-[-1]" />

      
    <div className="relative z-10">{children}</div>
    </div>
  );
};

export default BackgroundAnimation;
