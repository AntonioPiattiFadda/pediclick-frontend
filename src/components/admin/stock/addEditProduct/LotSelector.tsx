/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit2,  X } from "lucide-react";
import { useState } from "react";

// Componente para la gestión de lotes
const LotSelector = ({
  formData,
  setFormData,
  selectedLotIndex,
  setSelectedLotIndex,
  emptyLot,
}: {
  formData: any;
  setFormData: any;
  selectedLotIndex: any;
  setSelectedLotIndex: any;
  emptyLot: any;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newLotName, setNewLotName] = useState("");

  // useEffect(() => {
  //   if (!selectedLotIndex && formData.lots) {
  //     setSelectedLotIndex(formData.lots.length - 1);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [formData.lots]);

  // Función para iniciar la edición de un lote
  const startEditing = (index: number, currentName: string) => {
    setIsEditing(true);
    setEditingIndex(index);
    setEditValue(currentName || `Lote ${index + 1}`);
  };

  // Función para guardar el nombre editado
  const saveEdit = () => {
    if (editingIndex !== null) {
      const updatedLots = [...formData.lots];
      updatedLots[editingIndex] = {
        ...updatedLots[editingIndex],
        lot: editValue.trim() || `Lote ${editingIndex + 1}`,
      };
      setFormData({
        ...formData,
        lots: updatedLots,
      });
    }
    cancelEdit();
  };

  // Función para cancelar la edición
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setEditValue("");
  };

  // Función para agregar un nuevo lote
  const addNewLot = () => {
    const lotName = newLotName.trim();

    // No crear lote si no hay nombre
    if (!lotName) {
      return;
    }

    const newLot = {
      ...emptyLot,
      lot: lotName,
      lot_control: true,
    };

    setFormData({
      ...formData,
      lots: [...formData.lots, newLot],
    });
    setSelectedLotIndex(formData.lots.length);
    setNewLotName(""); // Limpiar el input
  };

  const lotControlLots = formData.lots.filter((lot: any) => lot.lot_control);

  return (
    <div className="mb-4">
      <Label>Lotes</Label>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 mt-1">
          {/* Select para elegir lote existente */}
          <select
            value={selectedLotIndex ?? ""}
            onChange={(e) => setSelectedLotIndex(Number(e.target.value))}
            className="flex-1 border rounded p-2"
          >
            <option value="">Selecciona Lote</option>
            {lotControlLots.map((lote: any, index: number) => (
              <option key={index} value={index + 1}>
                {lote.lot || `Lote ${index + 2}`}
              </option>
            ))}
          </select>

          {/* Botón para editar nombre del lote seleccionado */}
          {selectedLotIndex !== null && selectedLotIndex !== "" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                startEditing(
                  selectedLotIndex,
                  formData.lots[selectedLotIndex]?.lot
                )
              }
              className="px-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="flex ">
          {/* Sección para agregar nuevo lote */}
          <div className="flex items-center gap-2 mt-2 translate-x-6">
            <Input
              type="text"
              placeholder="Nombre del nuevo lote..."
              value={newLotName}
              onChange={(e) => setNewLotName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addNewLot();
                }
              }}
            />
          

            <Button variant="outline" onClick={addNewLot}>+ Nuevo</Button>
          </div>

          {/* PopOver para editar nombre */}
          {isEditing && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-transparent bg-opacity-40 backdrop-blur-xs z-40"
                onClick={cancelEdit}
              />

              {/* Popup */}
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border p-4 w-80 z-50">
                <h4 className="font-semibold mb-3">Editar nombre del lote</h4>

                <Input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full mb-3"
                  placeholder="Nombre del lote"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveEdit();
                    }
                    if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                  autoFocus
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={saveEdit}>
                    <Check className="w-3 h-3 mr-1" />
                    Guardar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LotSelector;
