import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BusinessProfileTab } from '@/components/admin/settings/BusinessProfileTab';
import { SitePreferencesTab } from '@/components/admin/settings/SitePreferencesTab';
import { AccountSecurityTab } from '@/components/admin/settings/AccountSecurityTab';

const Settings = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu negocio y cuenta
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="business">Perfil del Negocio</TabsTrigger>
          <TabsTrigger value="site">Preferencias del Sitio</TabsTrigger>
          <TabsTrigger value="account">Cuenta y Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <BusinessProfileTab />
        </TabsContent>

        <TabsContent value="site" className="space-y-6">
          <SitePreferencesTab />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountSecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;