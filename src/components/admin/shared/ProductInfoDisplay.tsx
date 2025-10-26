import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { ProductEditSheet } from "./productEditSheet";
import type { Product } from "@/types/products";

type ProductInfoAccordionProps = {
    product: Product;
    onChangeSelectedProduct: (productData: Product) => void;
    customElement?: React.ReactNode;
};

export const ProductInfoAccordion = ({ product, customElement, onChangeSelectedProduct }: ProductInfoAccordionProps) => {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="product-info">
                <AccordionTrigger className="text-sm font-medium">
                    Información del producto
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-4 gap-3 text-xs text-gray-700">
                        <InfoItem label="Código corto" value={product.short_code ?? "—"} />
                        <InfoItem label="Código de barras" value={product.barcode ?? "—"} />
                        <InfoItem label="Rubro" value={product.categories?.category_name ?? "—"} />

                        <InfoItem label="Categoría" value={product.sub_categories?.sub_category_name ?? "—"} />
                        <InfoItem label="Marca" value={product.brands?.brand_name ?? "—"} />
                        <InfoItem label="Nombre" value={product.product_name ?? "—"} />

                        <div className="col-span-1 flex items-center gap-2 mt-2">
                            <Label className="text-xs text-gray-600">Imagen</Label>
                            {customElement ? (
                                customElement
                            ) : product.public_image_src ? (
                                <img
                                    src={product.public_image_src}
                                    alt={product.product_name}
                                    className="w-10 h-10 rounded object-cover border border-gray-300"
                                />
                            ) : (
                                <span className="text-gray-400 text-xs">No hay imagen</span>
                            )}
                        </div>

                        {product.observations && (
                            <div className="col-span-3 mt-2">
                                <Label className="text-xs text-gray-600">Observaciones</Label>
                                <div className="border border-gray-200 bg-gray-50 rounded-md py-1.5 px-2 mt-1 text-gray-800 text-xs leading-snug">
                                    {product.observations}
                                </div>
                            </div>
                        )}


                        <div className="mt-2">
                            <ProductEditSheet
                                product={product}
                                onUpdated={(updated) => onChangeSelectedProduct(updated)}
                            />
                        </div>

                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

const InfoItem = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="flex flex-col gap-0.5">
        <Label className="text-[11px] text-gray-500">{label}</Label>
        <div className="border border-gray-200 bg-gray-50 rounded-md py-1 px-2 text-gray-800 text-[11px] truncate">
            {value !== null && value !== "" ? value : "—"}
        </div>
    </div>
);
