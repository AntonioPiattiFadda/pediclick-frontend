import React, { useState } from 'react';
import { User, Building, Phone, MapPin, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from './AuthLayout';

export function ProfileRegister() {
  const [formData, setFormData] = useState({
    full_name: '',
    user_type: 'buyer' as 'buyer' | 'seller',
    business_name: '',
    tax_id: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'México'
    }
  });
  
  const { updateProfile, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    await updateProfile(formData);
    // Redirect to dashboard or main app
    window.location.href = '/dashboard';
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <AuthLayout
          title="Completar Registro"
          description="Necesitamos algunos datos adicionales para configurar tu cuenta"
        >
    <div className="min-h-screen bg-gray-50 py-12 px-4">
     
        {/* <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Completa tu perfil
          </h1>
          <p className="text-muted-foreground">
            Necesitamos algunos datos adicionales para configurar tu cuenta
          </p>
        </div> */}

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información Personal</span>
            </CardTitle>
            <CardDescription>
              Completa tus datos personales y de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Información básica */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-foreground font-medium">
                    Nombre completo *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="pl-10"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Tipo de usuario *
                  </Label>
                  <RadioGroup
                    value={formData.user_type}
                    onValueChange={(value) => handleInputChange('user_type', value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buyer" id="buyer" />
                      <Label htmlFor="buyer">Comprador</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="seller" id="seller" />
                      <Label htmlFor="seller">Vendedor</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Información de negocio (solo para vendedores) */}
              {formData.user_type === 'seller' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-foreground flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Información de Negocio</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-foreground font-medium">
                      Nombre del negocio *
                    </Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      placeholder="Nombre de tu empresa"
                      required={formData.user_type === 'seller'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="text-foreground font-medium">
                      RFC / ID Fiscal
                    </Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder="RFC o identificación fiscal"
                    />
                  </div>
                </div>
              )}

              {/* Información de contacto */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Contacto</span>
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground font-medium">
                    Teléfono *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                      placeholder="+52 55 1234 5678"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Dirección</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-foreground font-medium">
                      Calle y número
                    </Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder="Calle y número"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground font-medium">
                      Ciudad
                    </Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      placeholder="Ciudad"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-foreground font-medium">
                      Estado
                    </Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      placeholder="Estado"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postal_code" className="text-foreground font-medium">
                      Código postal
                    </Label>
                    <Input
                      id="postal_code"
                      value={formData.address.postal_code}
                      onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                      placeholder="00000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Completar Registro'
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1">
                  Completar después
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
  
    </div>
    </AuthLayout>
  );
}
