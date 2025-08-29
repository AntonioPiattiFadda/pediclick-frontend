import { getPublicImages } from "@/service/images";
import { useQuery } from "@tanstack/react-query";
import { Trash2, ChevronDown, Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

// Tipo para la imagen (ajusta según tu API)
type PublicImage = {
  created_at: string;
  public_image_category: string;
  public_image_id: string;
  public_image_name: string;
  public_image_src: string;
};

interface ImageSelectorProps {
  onImageSelect?: (imageSrc: string | null) => void;
  onImageRemove?: () => void;
  selectedImageId?: number | null;
}

export const ImageSelector = ({
  onImageSelect,
  onImageRemove,
  selectedImageId
}: ImageSelectorProps) => {
  const [selectedImage, setSelectedImage] = useState<PublicImage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  

  const { data: images, isLoading } = useQuery({
    queryKey: ["public-images"],
    queryFn: async () => {
      const response = await getPublicImages();
      return response.images;
    },
  });

  useEffect(() => {
    
    if (selectedImageId && images) {
      const image = images.find((img) => img.public_image_id === selectedImageId);
      setSelectedImage(image || null);
    }
  }, [selectedImageId, images]);

  // Filtrar imágenes basado en el término de búsqueda
  const filteredImages = useMemo(() => {
    if (!images) return [];
    if (!searchTerm.trim()) return images;

    return images.filter(
      (image) =>
        image.public_image_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        image.public_image_category
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [images, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageSelect = (image: PublicImage) => {
    setSelectedImage(image);
    setSearchTerm("");
    setIsOpen(false);
    onImageSelect?.(image.public_image_id);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    onImageSelect?.(null);
    onImageRemove?.();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // const handleClearSelection = () => {
  //   setSelectedImage(null);
  //   setSearchTerm("");
  //   onImageSelect?.(null);
  //   inputRef.current?.focus();
  // };

  return (
    <div className="space-y-4">
      {/* Select con buscador */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Seleccionar imagen 
        </label>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
              size={16}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={
                selectedImage
                  ? selectedImage.public_image_name
                  : "Buscar imagen..."
              }
              className="w-full pl-10 pr-10 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={handleInputFocus}
            />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <ChevronDown
                className={`transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                size={16}
              />
            </button>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-2 text-gray-500">
                  Cargando imágenes...
                </div>
              ) : filteredImages.length > 0 ? (
                <>
                  {/* {searchTerm && selectedImage && (
                    <button
                      onClick={handleClearSelection}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-red-600 border-b"
                    >
                      Limpiar selección
                    </button>
                  )} */}
                  {filteredImages.map((image) => (
                    <button
                      key={image.public_image_id}
                      onClick={() => handleImageSelect(image)}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center space-x-3 ${
                        selectedImage?.public_image_id === image.public_image_id
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }`}
                    >
                      <img
                        src={image.public_image_src}
                        alt={image.public_image_name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {image.public_image_name}
                        </p>
                        {image.public_image_category && (
                          <p className="text-xs text-gray-500 truncate">
                            {image.public_image_category}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-2 text-gray-500">
                  {searchTerm
                    ? "No se encontraron imágenes"
                    : "No hay imágenes disponibles"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indicador de imagen seleccionada */}
        {/* {selectedImage && !isOpen && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
            <span>✓ Imagen seleccionada: {selectedImage.public_image_name}</span>
          </div>
        )} */}
      </div>

      {/* Preview de imagen seleccionada */}
      <div className="border rounded p-4 h-[300px] flex items-center justify-center">
        {selectedImage ? (
          <div className="relative group">
            <button
              onClick={handleImageRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              title="Eliminar imagen"
            >
              <Trash2 size={16} />
            </button>
            <img
              src={selectedImage.public_image_src}
              alt={selectedImage.public_image_name}
              className="max-w-full max-h-48 object-cover rounded"
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            Ninguna imagen seleccionada
          </p>
        )}
      </div>
    </div>
  );
};
