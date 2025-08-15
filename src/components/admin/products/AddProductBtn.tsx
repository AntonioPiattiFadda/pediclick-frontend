/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, UploadCloud, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createProduct, fetchUnits, getCategories } from "@/service";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProductSchema } from "@/validator/products";



export function AddProductBtn() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState("info");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
  });
  const [prices, setPrices] = useState([{ price: "", unit_id: "" }]);

  const queryClient = useQueryClient();

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories();
      return response.categories;
    },
  });

  const { data: units, isLoading: isUnitsLoading } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const units = await fetchUnits();
      return units;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: { formData: any; prices: any; images: any }) => {
      return await createProduct(data.formData, data.prices, data.images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      toast("Producto creado exitosamente", {
        description: "El producto ha sido creado correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
    onError: () => {
      toast("Error al crear el producto", {
        description: "Intentá nuevamente más tarde.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  useEffect(() => {
    if (images.length > 0) {
      const previews = images.map((img) => URL.createObjectURL(img));
      setImagePreviews(previews);
    }
  }, [images]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleImageReorder = (index: number, direction: "up" | "down") => {
    setImages((prev) => {
      const newArr = [...prev];
      if (direction === "up" && index > 0) {
        [newArr[index], newArr[index - 1]] = [newArr[index - 1], newArr[index]];
      } else if (direction === "down" && index < newArr.length - 1) {
        [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      }
      return newArr;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const completedInformation = {
      ...formData,
      images,
      prices,
    };

    const validation = createProductSchema.safeParse(completedInformation);

    if (!validation.success) {
      toast("Algunos datos fantantes ", {
        description: "Sunday, December 03, 2023 at 9:00 AM",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      return;
    }

    createProductMutation.mutate({
      formData,
      prices,
      images,
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <DialogDescription>
            Completá la información del nuevo producto que querés publicar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="prices">Precios</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            {/* <TabsTrigger value="seo">SEO</TabsTrigger> */}
          </TabsList>

          <TabsContent value="prices" className="space-y-4">
            {/* Precios dinámicos */}
            <div className="space-y-2">
              {prices.map((price, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={price.price}
                    onChange={(e) => {
                      const updated = [...prices];
                      updated[index].price = e.target.value;
                      setPrices(updated);
                    }}
                  />
                  <select
                    className="border rounded px-2 py-2 bg-white"
                    value={price.unit_id}
                    onChange={(e) => {
                      const updated = [...prices];
                      updated[index].unit_id = e.target.value;
                      setPrices(updated);
                    }}
                  >
                    <option value="">Seleccionar unidad</option>
                    {isUnitsLoading ? (
                      <option disabled>Cargando unidades...</option>
                    ) : (
                      units &&
                      units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...prices];
                      updated.splice(index, 1);
                      setPrices(updated);
                    }}
                    className="text-red-500 font-bold text-lg"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setPrices([...prices, { price: "", unit_id: "" }])
                }
                className="text-blue-500 font-semibold text-sm"
              >
                + Agregar precio
              </button>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Input
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {/* <Textarea
              placeholder="Descripción breve"
              value={formData.short_description}
              onChange={(e) =>
                setFormData({ ...formData, short_description: e.target.value })
              }
            /> */}
            <Textarea
              placeholder="Descripción completa"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            {isCategoriesLoading ? (
              <Input placeholder="Buscando tus categorías..." disabled />
            ) : (
              <select
                className="w-full border rounded px-2 py-1"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
              >
                <option value="">Seleccioná categoría</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            {/* <Input
              placeholder="Marca"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
            /> */}
            {/* <select
              className="w-full border rounded px-2 py-1"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select> */}
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-dashed border-2 rounded p-6 text-center cursor-pointer"
            >
              <UploadCloud className="mx-auto mb-2" />
              <p>Arrastrá imágenes acá o seleccioná archivos</p>
              <Input
                type="file"
                multiple
                onChange={(e) =>
                  setImages([
                    ...images,
                    ...(e.target.files ? Array.from(e.target.files) : []),
                  ])
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={src}
                    alt="preview"
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleImageReorder(idx, "up")}>
                      ⬆️
                    </button>
                    <button onClick={() => handleImageReorder(idx, "down")}>
                      ⬇️
                    </button>
                    <button onClick={() => handleRemoveImage(idx)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* <TabsContent value="seo" className="space-y-4">
            <Input placeholder="SEO Title" />
            <Textarea placeholder="SEO Description" />
          </TabsContent> */}
        </Tabs>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={createProductMutation.isLoading}
              variant="outline"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={createProductMutation.isLoading}
            onClick={handleSubmit}
          >
            {createProductMutation.isLoading ? "Creando..." : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
