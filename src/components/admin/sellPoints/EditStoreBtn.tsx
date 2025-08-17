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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ValidationErrorMessage } from "@/components/ui/validationErrorMessage";
import { editStore, getStoreByStoreId } from "@/service/stores";
import type { Store } from "@/types";
import { editStoreSchema } from "@/validator/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ZodIssue } from "zod";
import { useUserStoresContext } from "@/contexts/UserStoresContext";

const emptyStore = {
  store_id: 0,
  business_owner_id: "",
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
  deleted_at: '',
  updated_at: '',
  created_at: '',
};

export function EditStoreBtn({ id }: { id:  number }) {
  const { setUserStores } = useUserStoresContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zErrors, setZErrors] = useState<ZodIssue[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Store>(emptyStore);

  const queryClient = useQueryClient();

  const { data: store } = useQuery<Store | null>({
    queryKey: ["store", id],
    queryFn: async () => {
      const result = await getStoreByStoreId(id);
      return result.store as Store | null;
    },
    enabled: !!id,
  });

  // ✅ sincronizamos formData con el resultado de la query
  useEffect(() => {
    if (store) {
      setFormData(store);
    }
  }, [store]);

  const editStoreMutation = useMutation({
    mutationFn: async (data: { formData: Store }) => {
      return await editStore(id, data.formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
      setUserStores((prev) =>
        prev.map((store) =>
          store.store_id === id ? { ...store, ...formData } : store
        )
      );
      setIsModalOpen(false);
      resetForm();
      toast("Excelente!", {
        description: "La tienda ha sido actualizada correctamente.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message;
      setErrorMessage(errorMessage);
      setTimeout(() => {
        setErrorMessage(null);
      }, 3000);
    },
  });

  const resetForm = () => {
    setZErrors([]);
  };

  const handleSubmit = () => {
    const validation = editStoreSchema.safeParse(formData);

    if (!validation.success) {
      setZErrors(validation.error.issues);
      setTimeout(() => {
        setZErrors([]);
      }, 3000);
      return;
    }

    // ✅ aseguramos que siempre se mande el id correcto
    editStoreMutation.mutate({
      formData: { ...formData, store_id: id },
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Editar</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nueva Tienda</DialogTitle>
          <DialogDescription>
            Completá la información de la nueva tienda que querés agregar.
          </DialogDescription>
        </DialogHeader>

        {store ? (
          <div className="grid gap-4 py-4">
            {/* Store Name */}
            <div className="grid gap-2 relative">
              <Label htmlFor="store_name">Nombre de la Tienda *</Label>
              <Input
                id="store_name"
                placeholder="Mi Tienda Local"
                className={`border ${
                  zErrors?.find((error: any) =>
                    error.path.includes("store_name")
                  )
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md p-2`}
                value={formData?.store_name}
                onChange={(e) =>
                  setFormData({ ...formData, store_name: e.target.value })
                }
              />
              <ValidationErrorMessage
                zErrors={zErrors}
                fieldName="store_name"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2 relative">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripción de tu tienda..."
                value={formData?.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
              <ValidationErrorMessage
                zErrors={zErrors}
                fieldName="description"
              />
            </div>

            {/* Address */}
            <div className="grid gap-2 relative">
              <Label htmlFor="address">Dirección (opcional)</Label>
              <Textarea
                id="address"
                placeholder="Calle Ejemplo 123, Ciudad, Provincia"
                value={formData?.address}
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
                  value={formData?.phone}
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
                  value={formData?.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                />
                <ValidationErrorMessage
                  zErrors={zErrors}
                  fieldName="whatsapp"
                />
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
                  value={formData?.email}
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
                  value={formData?.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
                <ValidationErrorMessage zErrors={zErrors} fieldName="website" />
              </div>
            </div>

            {/* Social Links */}
            {/* <div className="grid gap-2 relative">
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
          </div> */}

            {/* Opening Hours */}
            {/* <div className="grid gap-2 relative">
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
          </div> */}

            {/* Slug */}
            <div className="grid gap-2 relative">
              <Label htmlFor="slug">Slug de URL (opcional)</Label>
              <Input
                id="slug"
                placeholder="mi-tienda-local"
                value={formData?.slug}
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
        ) : (
          <Skeleton className="h-96" />
        )}

        {errorMessage && (
          <div className="mt-2 text-sm text-red-500 absolute bottom-18 left-6">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              disabled={editStoreMutation.isLoading}
              variant="ghost"
              onClick={resetForm}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={editStoreMutation.isLoading} onClick={handleSubmit}>
            {editStoreMutation.isLoading ? "Editando..." : "Editar Tienda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
