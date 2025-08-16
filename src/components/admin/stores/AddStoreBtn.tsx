/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createStoreSchema } from "@/validator/stores";
import { createStore } from "@/service";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import type { Store } from "@/types";
import type { ZodIssue } from "zod";
import { ValidationErrorMessage } from "@/components/ui/validationErrorMessage";

export function AddStoreBtn() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setUserStores, setSelectedStoreId } = useUserStoresContext();
  const [zErrors, setZErrors] = useState<ZodIssue[]>([]);

  const [formData, setFormData] = useState({
    store_name: "",
    description: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    social_links: "",
    opening_hours: "",
    slug: "",
  });

  const queryClient = useQueryClient();

  const createStoreMutation = useMutation({
    mutationFn: async (data: { formData: any }) => {
      return await createStore(data.formData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      setIsModalOpen(false);
      resetForm();
      // Ensure data is a Store, not an array
      // If data is an array, take the first element; otherwise, use data directly
      const newStore = Array.isArray(data) ? data[0] : data;
      setUserStores((prevStores) => [...prevStores, newStore as Store]);
      setSelectedStoreId(newStore.store_id);
      toast("Tienda agregada exitosamente", {
        description: "La tienda ha sido creada correctamente.",
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      toast("Error al crear tienda", {
        description: errorMessage,
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
    },
  });

  const resetForm = () => {
    setFormData({
      store_name: "",
      description: "",
      address: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      social_links: "",
      opening_hours: "",
      slug: "",
    });
  };

  const handleSubmit = () => {
    const validation = createStoreSchema.safeParse(formData);

    if (!validation.success) {
      setZErrors(validation.error.issues);
      setTimeout(() => {
        setZErrors([]);
      }, 3000);

      return;
    }

    createStoreMutation.mutate({
      formData,
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-accent" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tienda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nueva Tienda</DialogTitle>
          <DialogDescription>
            Completá la información de la nueva tienda que querés agregar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Store Name */}
          <div className="grid gap-2 relative">
            <Label htmlFor="store_name">Nombre de la Tienda *</Label>
            <Input
              id="store_name"
              placeholder="Mi Tienda Local"
              className={`border ${
                zErrors?.find((error: any) => error.path.includes("store_name"))
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md p-2`}
              value={formData.store_name}
              onChange={(e) =>
                setFormData({ ...formData, store_name: e.target.value })
              }
            />
            <ValidationErrorMessage zErrors={zErrors} fieldName="store_name" />
          </div>

          {/* Description */}
          <div className="grid gap-2 relative">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descripción de tu tienda..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
             <ValidationErrorMessage zErrors={zErrors} fieldName="description" />
          </div>

          {/* Address */}
          <div className="grid gap-2 relative">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Textarea
              id="address"
              placeholder="Calle Ejemplo 123, Ciudad, Provincia"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
            />
            <ValidationErrorMessage zErrors={zErrors} fieldName="address" />
          </div>

          {/* Contact Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <ValidationErrorMessage zErrors={zErrors} fieldName="phone" />
            </div>

            {/* WhatsApp */}
            <div className="grid gap-2 relative">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
              />
              <ValidationErrorMessage zErrors={zErrors} fieldName="whatsapp" />
            </div>
          </div>

          {/* Email and Website Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="grid gap-2 relative">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="tienda@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <ValidationErrorMessage zErrors={zErrors} fieldName="email" />
            </div>

            {/* Website */}
            <div className="grid gap-2 relative">
              <Label htmlFor="website">Sitio Web (opcional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://mitienda.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
              />
              <ValidationErrorMessage zErrors={zErrors} fieldName="website" />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid gap-2 relative">
            <Label htmlFor="social_links">
              Enlaces de Redes Sociales (opcional)
            </Label>
            <Textarea
              id="social_links"
              placeholder="Facebook: https://facebook.com/mitienda&#10;Instagram: https://instagram.com/mitienda"
              value={formData.social_links}
              onChange={(e) =>
                setFormData({ ...formData, social_links: e.target.value })
              }
              rows={3}
            />
             <ValidationErrorMessage zErrors={zErrors} fieldName="social_links" />
          </div>

          {/* Opening Hours */}
         <div className="grid gap-2 relative">
            <Label htmlFor="opening_hours">
              Horarios de Atención (opcional)
            </Label>
            <Textarea
              id="opening_hours"
              placeholder="Lunes a Viernes: 9:00 - 18:00&#10;Sábados: 9:00 - 14:00&#10;Domingos: Cerrado"
              value={formData.opening_hours}
              onChange={(e) =>
                setFormData({ ...formData, opening_hours: e.target.value })
              }
              rows={3}
            />
               <ValidationErrorMessage zErrors={zErrors} fieldName="opening_hours" />
          </div>

          {/* Slug */}
              <div className="grid gap-2 relative">
            <Label htmlFor="slug">Slug de URL (opcional)</Label>
            <Input
              id="slug"
              placeholder="mi-tienda-local"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Se usará para crear la URL amigable de tu tienda
            </p>
             <ValidationErrorMessage zErrors={zErrors} fieldName="slug" />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={createStoreMutation.isLoading}
              variant="outline"
              onClick={resetForm}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={createStoreMutation.isLoading}
            onClick={handleSubmit}
          >
            {createStoreMutation.isLoading ? "Creando..." : "Crear Tienda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
