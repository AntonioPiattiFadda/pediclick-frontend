import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from './AuthLayout';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  
  const { forgotPassword, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    await forgotPassword(email);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout
        title="Email Enviado"
        description="Te hemos enviado las instrucciones a tu correo"
        showBackToLogin
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground">
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </p>
          </div>
          <Button
            onClick={() => setSent(false)}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Enviar a otro correo
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar Contraseña"
      description="Ingresa tu correo para enviarte las instrucciones"
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar instrucciones'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}