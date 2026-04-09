const LoadingWave = () => {
  return (
    <div className="w-full flex items-center justify-center py-6">
      <div className="flex items-end gap-2 h-16">
        <span className="block w-2 rounded-sm bg-black dark:bg-orange-500 animate-wave delay-0" style={{ height: '8px' }} />
        <span className="block w-2 rounded-sm bg-black dark:bg-orange-500 animate-wave delay-100" style={{ height: '8px' }} />
        <span className="block w-2 rounded-sm bg-black dark:bg-orange-500 animate-wave delay-200" style={{ height: '8px' }} />
        <span className="block w-2 rounded-sm bg-black dark:bg-orange-500 animate-wave delay-300" style={{ height: '8px' }} />
      </div>

      <style>{`
        .animate-wave { animation: wave 900ms ease-in-out infinite; display: inline-block; }
        .delay-0 { animation-delay: 0ms; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        @keyframes wave {
          0% { transform: scaleY(0.45); }
          50% { transform: scaleY(1.6); }
          100% { transform: scaleY(0.45); }
        }
      `}</style>
    </div>
  );
};

export default LoadingWave;
