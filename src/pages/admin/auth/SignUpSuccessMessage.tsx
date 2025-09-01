import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";

type Props = {
  email?: string; // opcional: ej. "usuario@gmail.com"
};

const SignUpSuccessMessage: React.FC<Props> = ({ email }) => {
  console.log(email);
  //NOTE Con el email podemos agregar un boton para abrir la bandeja de entrada
  //NOTE Agregar un timer para que se reenvie el codigo
  const [isExploding, setIsExploding] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowMessage(true), 200);
    const confettiTimer = setTimeout(() => setIsExploding(false), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  const handleResendOrReport = () => {
    alert("Notificación: falló el link de mail");
  };

  return (
    <>
      {/* Confetti */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        {isExploding && (
          <ConfettiExplosion
            force={0.8}
            duration={3000}
            particleCount={150}
            width={2000}
            colors={[
              "#ff6b6b",
              "#4ecdc4",
              "#45b7d1",
              "#96ceb4",
              "#feca57",
              "#ff9ff3",
              "#54a0ff",
            ]}
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`max-w-lg mx-auto transition-all duration-1000 transform ${
          showMessage
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        <CardContent>
          {/* Subcopy */}
          <p className="text-gray-600 mb-1 text-center">
            Te enviamos un correo con un{" "}
            <span className="font-semibold">link de inicio de sesión</span> para
            activar tu cuenta.
          </p>
          <p className="text-gray-500 text-sm mb-6 text-center">
            Puede demorar unos segundos en llegar.
          </p>

          {/* Provider selector
          <div className="grid gap-3 text-left mb-5">
            <label className="text-sm text-gray-700 font-medium">
              Abrir mi casilla de correo:
            </label>
            {!email && (
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="https://mail.google.com/">Gmail</option>
                <option value="https://outlook.live.com/mail/">
                  Outlook/Hotmail
                </option>
                <option value="https://mail.yahoo.com/">Yahoo</option>
                <option value="https://www.icloud.com/mail/">iCloud</option>
                <option value="https://mail.proton.me/u/0/inbox">Proton</option>
                <option value="">Otro (pegar URL abajo)</option>
              </select>
            )}

            <input
              type="url"
              placeholder={
                email
                  ? getInboxUrlFromEmail(email)
                  : "https://tu-proveedor-de-correo.com"
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={customProvider}
              onChange={(e) => setCustomProvider(e.target.value)}
            />
          </div> */}

          {/* Go to inbox button */}
          {/* <button
            onClick={handleGoToInbox}
            className="inline-flex items-center justify-center w-full md:w-auto gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold px-5 py-3 transition-colors"
          >
            Ir a mi bandeja de entrada ✉️
          </button> */}

          {/* Didn't get the email */}
          <div className="mt-4 w-full text-center">
            <Button onClick={handleResendOrReport} variant={"link"}>
              ¿No llegó el mail? Clickeá aquí
            </Button>
          </div>
        </CardContent>
      </div>
    </>
  );
};

export default SignUpSuccessMessage;
