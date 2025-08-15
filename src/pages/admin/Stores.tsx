import { StoresContainer } from "@/components/admin/stores/StoresContainer";
const Stores = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestión de tus Locales comerciales
        </h1>
        <p className="text-muted-foreground">Administra tus locales</p>
      </div>

      <StoresContainer />
    </div>
  );
};

export default Stores;
