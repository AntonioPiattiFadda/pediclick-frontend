import { Info } from "lucide-react";
import { useRef, useState } from "react";

const PasswordInfoPopover = () => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Cancelar cualquier timeout pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    // Establecer un pequeño delay antes de ocultar
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  return (
    <div className="relative inline-block">
      <div
        className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors duration-200"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info size={20} />
      </div>

      {isVisible && (
        <div
          className="absolute left-8 top-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in fade-in duration-200"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
          <div className="absolute -left-3 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-200"></div>

          <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">
            Contraseña 
          </h3>

          <div className="space-y-3">
            <div className="border-l-4 border-l-blue-400 pl-3">
              {/* <div className="font-medium text-gray-700 text-sm">
                La contraseña debe tener al menos 6 caracteres, incluyendo
                letras y números.
              </div> */}
              <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                La contraseña podrá ser cambiada más tarde a través del email del nuevo miembro del equipo.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInfoPopover;
