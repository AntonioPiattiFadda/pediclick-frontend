import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLot } from "@/service/lots";
import type { Lot } from "@/types/lots";
import type { Product, SellMeasurementMode } from "@/types/products";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Barcode, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { emptyProduct } from "../stock/addEditProduct/emptyFormData";
import { CategorySelector } from "../stock/CategorySelector";
import CheckBoxesSelector from "./checkBoxesSelector";
import { emptyLot } from "./emptyFormData";
import ProductSelectorV2 from "./productSelectorV2";
import { SubCategorySelector } from "../stock/addEditProduct/SubCategorySelector";
import { BrandSelector } from "../stock/addEditProduct/BrandsSelector";
import { ImageSelector } from "../stock/addEditProduct/ImageSelector";
import { Textarea } from "@/components/ui/textarea";

type CreationMode = "SHORT" | "LONG";

const creationModeOptions = [
  { label: "Corto", value: "SHORT" },
  { label: "Largo", value: "LONG" },
];

const sellMeasurementModeOptions = [
  { label: "Unidad", value: "QUANTITY" },
  { label: "Kg", value: "WEIGHT" },
];

export function AddLotBtn() {
  const [creationMode, setCreationMode] = useState<CreationMode>("SHORT");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product>(emptyProduct);

  const isProductSelected = Boolean(selectedProduct.product_id);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Lot>(emptyLot);

  const queryClient = useQueryClient();

  //   const { role } = useAppSelector((state) => state.user);
  //   const { selectedStoreId } = useUserStoresContext();

  const createLotMutation = useMutation({
    mutationFn: async (data: { completedInformation: Lot }) => {
      return await createLot(data.completedInformation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      toast("Elemento creado exitosamente", {
        description: "El elemento ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      setFormData(emptyLot);
    },
    onError: () => {
      toast("Error al agregar el elemento", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const handleSubmit = () => {
    // const completedInformation = adaptProductForDb(
    //   formData,
    //   selectedStoreId || 0
    // );

    // const validation = createProductSchema.safeParse(completedInformation);

    // if (!validation.success) {
    //   toast("Algunos datos fantantes ", {
    //     description: "Sunday, December 03, 2023 at 9:00 AM",
    //     action: {
    //       label: "Undo",
    //       onClick: () => console.log("Undo"),
    //     },
    //   });
    //   return;
    // }
    // console.log("completedInformation", completedInformation);
    createLotMutation.mutate({
      completedInformation: formData,
    });
  };

  // const { data: subCategories, isLoading: isLoadingSub } = useQuery({
  //   queryKey: ["sub-categories"],
  //   queryFn: async () => {
  //     const response = await getSubCategories(role);
  //     return response.categories;
  //   },
  // });

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar elemento
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`border-4  ${
          isEditing ? " border-green-200 " : "border-transparent"
        }  flex  flex-col gap-2 w-[750px] overflow-y-auto max-h-[90vh] min-h-[500px]`}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editando producto"
              : `${
                  selectedProduct.product_name
                    ? "Producto: " + selectedProduct.product_name
                    : "Elegir producto"
                }`}
          </DialogTitle>
          {/* <DialogDescription>
            Completá la información del nuevo elemento que querés publicar.
          </DialogDescription> */}
        </DialogHeader>

        {!isEditing && (
          <ProductSelectorV2
            value={selectedProduct}
            onChange={(value) =>
              setSelectedProduct({ ...selectedProduct, ...value })
            }
          />
        )}

        {/* <ProductSelector
          value={selectedProduct.product_id || 0}
          onChange={setSelectedProduct}
        /> */}

        {isProductSelected ? (
          <>
            <CheckBoxesSelector
              options={creationModeOptions}
              selectedOption={creationMode}
              onSelectOption={(value) => setCreationMode(value as CreationMode)}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lot_number">Código corto</Label>
                <Input
                  placeholder="Código corto"
                  disabled={!isEditing}
                  type="number"
                  value={selectedProduct.short_code || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      short_code: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex gap-2" htmlFor="barcode">
                  Código de barras <Barcode height={14} />
                </Label>
                <Input
                  placeholder="barcode"
                  disabled={!isEditing}
                  type="number"
                  value={selectedProduct.barcode || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      barcode: e.target.value,
                    })
                  }
                />
              </div>

              <CategorySelector
                value={selectedProduct.category_id}
                onChange={(id) =>
                  setSelectedProduct({ ...selectedProduct, category_id: id })
                }
              />

              <SubCategorySelector
                value={selectedProduct.sub_category_id}
                onChange={(id) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    sub_category_id: id,
                  })
                }
              />

              <BrandSelector
                value={selectedProduct.brand_id}
                onChange={(id) =>
                  setSelectedProduct({ ...selectedProduct, brand_id: id })
                }
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="lot_number">Nombre</Label>
                <Input
                  placeholder="product_name"
                  disabled={!isEditing}
                  type="text"
                  value={selectedProduct.product_name}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      product_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="lot_number">Nro de Lote</Label>
                <Input
                  placeholder="Nro de Lote"
                  disabled={!isEditing}
                  type="number"
                  value={formData.lot_number}
                  onChange={(e) =>
                    setFormData({ ...formData, lot_number: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Modo de venta</Label>

                <CheckBoxesSelector
                  options={sellMeasurementModeOptions}
                  selectedOption={selectedProduct.sell_measurement_mode}
                  onSelectOption={(value) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      sell_measurement_mode: value as SellMeasurementMode,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  placeholder=""
                  disabled={!isEditing}
                  value={selectedProduct.observations || ""}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      observations: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {creationMode === "LONG" && (
              <>
                <div>
                  <Label htmlFor="lot_number">Nro de Lote</Label>
                  <Input
                    placeholder="Nro de Lote"
                    type="number"
                    disabled={isEditing}
                    value={formData.lot_number}
                    onChange={(e) =>
                      setFormData({ ...formData, lot_number: e.target.value })
                    }
                  />
                </div>

                <ImageSelector
                  onImageSelect={(id) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      public_image_id: id ?? "",
                    })
                  }
                  onImageRemove={() =>
                    setSelectedProduct({
                      ...selectedProduct,
                      public_image_id: "",
                    })
                  }
                />
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full text-center  my-auto">
            Seleccionar un producto
          </div>
        )}

        <DialogFooter className="mt-auto ">
          <span className="mr-auto h-full my-auto">
            Ultima actualización: {selectedProduct.updated_at}
          </span>
          {/* <DialogClose asChild>
            <Button disabled={createLotMutation.isLoading} variant="outline">
              Cancelar
            </Button>
          </DialogClose> */}
          {Object.keys(selectedProduct).length > 0 && (
            <>
              {isEditing ? (
                <Button variant={"outline"} onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Modificar</Button>
              )}

              <Button
                disabled={createLotMutation.isLoading}
                onClick={handleSubmit}
              >
                {createLotMutation.isLoading
                  ? "Agregando..."
                  : "Agregar a remito"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
