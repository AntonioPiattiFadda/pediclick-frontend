import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import React, { useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { supabase } from "@/service";
import { toast } from "sonner";

export function ResetPassword() {
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // const validateForm = () => {
  //   const newErrors: Record<string, string> = {};

  //   if (formData.code.length !== 6) {
  //     newErrors.code = 'El código debe tener 6 caracteres';
  //   }

  //   if (formData.password.length < 6) {
  //     newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
  //   }

  //   if (formData.password !== formData.confirmPassword) {
  //     newErrors.confirmPassword = 'Las contraseñas no coinciden';
  //   }

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      email: formData.email,
      password: formData.password,
    });
    console.log(data, error);
    if (!error) {
      setLoading(false);
      setSuccess(true);
    } else {
      toast.error("Error al actualizar la contraseña");
    }
    // if (!validateForm()) return;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Contraseña Actualizada"
        description="Tu contraseña ha sido cambiada exitosamente"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground">
              Tu contraseña ha sido actualizada correctamente
            </p>
            <p className="text-sm text-muted-foreground">
              Ya puedes iniciar sesión con tu nueva contraseña
            </p>
          </div>
          <Button asChild className="w-full">
            <a href="/sign-in">Ir a Iniciar Sesión</a>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Restablecer Contraseña"
      description="Ingresa el código que recibiste y tu nueva contraseña"
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )} */}

        {/* <div className="space-y-2">
          <Label htmlFor="code" className="text-foreground font-medium">
            Código de verificación
          </Label>
          <Input
            id="code"
            type="text"
            value={formData.code}
            onChange={(e) => handleInputChange('code', e.target.value.slice(0, 6))}
            className="text-center text-lg tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
          />
          {errors.code && (
            <p className="text-red-500 text-xs">{errors.code}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Ingresa el código de 6 dígitos que recibiste por email
          </p>
        </div> */}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="pl-10 pr-10"
              placeholder="Ingresa tu email"
              required
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="pl-10 pr-10"
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-foreground font-medium"
          >
            Confirmar nueva contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className="pl-10 pr-10"
              placeholder="Repite tu nueva contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Actualizar Contraseña"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
