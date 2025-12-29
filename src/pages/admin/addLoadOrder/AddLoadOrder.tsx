import { AddLoadOrderContainer } from "@/pages/admin/addLoadOrder/components/AddLoadOrderContainer";

const AddLoadOrder = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Crea tu orden de carga
        </h1>
        <p className="text-muted-foreground">Administra tus remitos</p>
      </div>
      <AddLoadOrderContainer />
    </div>
  );
};

export default AddLoadOrder;
