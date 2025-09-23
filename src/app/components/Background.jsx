const WarmBeigeBackground = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-[#f5f5dc] relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120,119,198,0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.5) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120,119,198,0.1) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default WarmBeigeBackground;


