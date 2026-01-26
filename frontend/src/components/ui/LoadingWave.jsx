const LoadingWave = () => {
    return (
        <>
            <div className="loading-wave">
                <div className="loading-bar" />
                <div className="loading-bar" />
                <div className="loading-bar" />
                <div className="loading-bar" />
            </div>

            <style>{`
        .loading-wave {
          width: 200px;
          height: 100px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .loading-bar {
          width: 10px;
          height: 10px;
          margin: 0 5px;
          background-color: #3b82f6;
;
          border-radius: 5px;
          animation: loading-wave-animation 1s ease-in-out infinite;
        }

        .loading-bar:nth-child(2) {
          animation-delay: 0.1s;
        }

        .loading-bar:nth-child(3) {
          animation-delay: 0.2s;
        }

        .loading-bar:nth-child(4) {
          animation-delay: 0.3s;
        }

     @keyframes loading-wave-animation {
        0% { height: 10px; }
        50% { height: 20px; } /* was 50px */
        100% { height: 10px; }
    }

      `}</style>
        </>
    )
}

export default LoadingWave
