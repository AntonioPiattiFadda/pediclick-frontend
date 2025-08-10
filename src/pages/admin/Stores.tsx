import { StoresTab } from '@/components/stores/StoresTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
const Stores = () => {
  return (
     <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de tus Locales comerciales</h1>
        <p className="text-muted-foreground">
          Administra tus locales
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="products">Locales</TabsTrigger>
          
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <StoresTab />
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default Stores