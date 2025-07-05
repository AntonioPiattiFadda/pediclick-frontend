import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, Shield, Zap, Users } from "lucide-react";

const AdminHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">MiApp</div>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <a href="/sign-in">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </a>
            </Button>
            <Button asChild>
              <a href="/sign-up">
                <UserPlus className="mr-2 h-4 w-4" />
                Registrarse
              </a>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Bienvenido a tu plataforma
            <span className="text-blue-600"> de confianza</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La solución completa para gestionar tu negocio de manera eficiente, 
            segura y con todas las herramientas que necesitas.
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild>
              <a href="/sign-up">
                Comenzar Gratis
                <UserPlus className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/sign-in">
                Ya tengo cuenta
                <LogIn className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Seguridad Garantizada</CardTitle>
              <CardDescription>
                Tus datos están protegidos con los más altos estándares de seguridad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Rápido y Eficiente</CardTitle>
              <CardDescription>
                Herramientas diseñadas para optimizar tu tiempo y productividad
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center border-0 shadow-lg">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Soporte 24/7</CardTitle>
              <CardDescription>
                Nuestro equipo está disponible para ayudarte en todo momento
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-blue-600 text-white border-0">
          <CardContent className="text-center py-12">
            <CardTitle className="text-3xl mb-4">
              ¿Listo para comenzar?
            </CardTitle>
            <CardDescription className="text-blue-100 mb-6 text-lg">
              Únete a miles de usuarios que ya confían en nuestra plataforma
            </CardDescription>
            <Button size="lg" variant="secondary" asChild>
              <a href="/sign-up">
                Crear mi cuenta gratis
                <UserPlus className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 MiApp. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminHome;