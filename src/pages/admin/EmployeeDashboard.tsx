import { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";

const EmployeeDashboard = () => {
  const [isExploding, setIsExploding] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Mostrar el mensaje después de un pequeño delay para sincronizar con el confetti
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, 200);

    // Detener el confetti después de unos segundos
    const confettiTimer = setTimeout(() => {
      setIsExploding(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Confetti Effect */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        {isExploding && (
          <ConfettiExplosion
            force={0.8}
            duration={3000}
            particleCount={150}
            width={2000}
            colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']}
          />
        )}
      </div>

      {/* Success Message Card */}
      <div className={`max-w-md mx-auto transition-all duration-1000 transform ${showMessage ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-8'
        }`}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          {/* Icon Animation */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
              <div className="text-4xl">✅</div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4 animate-pulse">
            ¡Cuenta Verificada! 🎉
          </h1>

          <div className="space-y-3 text-lg text-gray-600">
            <p className="flex items-center justify-center gap-2">
              <span>🌟</span>
              <span>Tu verificación fue exitosa</span>
              <span>🌟</span>
            </p>

            <p className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>¡Listo para comenzar!</span>
              <span>🚀</span>
            </p>
          </div>

          {/* Success Badge */}
          {/* <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border-2 border-green-200">
            <span className="text-green-600 font-semibold">Estado:</span>
            <span className="text-green-700 font-bold">Activo</span>
            <span className="text-xl">💚</span>
          </div> */}

          {/* Welcome Message */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
            <p className="text-blue-700 font-medium flex items-center justify-center gap-2">
              <span>👋</span>
              <span>¡Bienvenido al equipo!</span>
              <span>🎊</span>
            </p>
          </div>

          {/* Floating Emojis Animation */}
          {/* <div className="relative mt-4 h-12 overflow-hidden">
            <div className="absolute animate-bounce" style={{ animationDelay: '0s', left: '10%' }}>🎉</div>
            <div className="absolute animate-bounce" style={{ animationDelay: '0.5s', left: '30%' }}>✨</div>
            <div className="absolute animate-bounce" style={{ animationDelay: '1s', left: '50%' }}>🥳</div>
            <div className="absolute animate-bounce" style={{ animationDelay: '1.5s', left: '70%' }}>🎊</div>
            <div className="absolute animate-bounce" style={{ animationDelay: '2s', left: '90%' }}>🌟</div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;