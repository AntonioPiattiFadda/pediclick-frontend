import { AddStoreBtn } from '../sellPoints/AddStoreBtn'

const NoStoreModal = () => {
  return (
    <>
    <div className="fixed inset-0 bg-black opacity-50 flex items-center justify-center z-10">
        </div>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 fixed z-50 top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          {/* Icono de tienda */}
          <div className="mb-6">
            <svg 
              className="mx-auto h-16 w-16 text-gray-300" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Empecemos tu aventura! 🚀
          </h2>
          
          {/* Mensaje */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Parece que aún no has creado tu primera tienda. ¡No te preocupes! 
            Crear una tienda es súper fácil y solo te tomará unos minutos. 
            ¡Es el primer paso para hacer crecer tu negocio! ✨
          </p>
          
          {/* Botón */}
          <AddStoreBtn />
        </div>
      </div>
  </>
  )
}

export default NoStoreModal