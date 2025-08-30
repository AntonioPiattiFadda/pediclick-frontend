import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  showBackToLogin?: boolean;
}

export function AuthLayout({ children, title, description, showBackToLogin = false }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar azul inspirada en el dashboard */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Bienvenido a nuestro sistema</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Únete a miles de usuarios que ya confían en nuestra plataforma para gestionar 
            sus operaciones de manera eficiente y segura.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Seguridad garantizada</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Soporte 24/7</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span className="text-blue-100">Fácil de usar</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Área del formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {children}
              
              {showBackToLogin && (
                <div className="text-center">
                  <a 
                    href="/sign-in" 
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    ← Volver al inicio de sesión
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
