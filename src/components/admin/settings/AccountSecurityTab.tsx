import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Mail, Shield } from 'lucide-react';

export const AccountSecurityTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Información de la Cuenta
          </CardTitle>
          <CardDescription>
            Información básica de tu cuenta de usuario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">Nombre</Label>
              <Input 
                id="first-name" 
                placeholder="Juan"
                defaultValue="Juan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Apellido</Label>
              <Input 
                id="last-name" 
                placeholder="Pérez"
                defaultValue="Pérez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-account">Email</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="email-account" 
                type="email"
                placeholder="juan@ejemplo.com"
                defaultValue="juan@techstore.com"
                disabled
              />
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Verificado
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Input 
              id="role" 
              defaultValue="Administrador"
              disabled
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <Input 
              id="current-password" 
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input 
              id="new-password" 
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
            <Input 
              id="confirm-password" 
              type="password"
              placeholder="••••••••"
            />
          </div>

          <Button>Cambiar Contraseña</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Seguridad de la Cuenta
          </CardTitle>
          <CardDescription>
            Configuración adicional de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Autenticación de Dos Factores</h4>
              <p className="text-sm text-muted-foreground">
                Añade una capa extra de seguridad a tu cuenta
              </p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Sesiones Activas</h4>
              <p className="text-sm text-muted-foreground">
                Administra las sesiones activas en diferentes dispositivos
              </p>
            </div>
            <Button variant="outline">Ver Sesiones</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Registro de Actividad</h4>
              <p className="text-sm text-muted-foreground">
                Revisa la actividad reciente de tu cuenta
              </p>
            </div>
            <Button variant="outline">Ver Registro</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
