import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "@/service";
import type { Product } from "@/types";
import { DeleteTableElementPopUp } from "../shared/deleteTableElementPopUp";
import { EditProductBtn } from "./addEditProduct/EditProductBtn";

interface ProductsTableProps {
  products: Product[];
  isSearchingTerm: boolean;
}

export const ProductsTable = ({
  products,
  isSearchingTerm,
}: ProductsTableProps) => {
  console.log(products);


 

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acciones</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Subcategoría</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Unidad de Venta</TableHead>
            <TableHead>Código de barras</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Precios</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Notificación</TableHead>
            <TableHead>Bulto</TableHead>
            <TableHead>Merma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isSearchingTerm && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={13} className="text-center">
                No se encontraron resultados
              </TableCell>
            </TableRow>
          )}

          {!isSearchingTerm && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={13} className="text-center">
                No tienes productos aún. ¡Agrega tu primer producto!
              </TableCell>
            </TableRow>
          )}
          {products.map((product) => (
            <TableRow key={product.product_id}>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditProductBtn productId={product.product_id || 0} />

                  <DeleteTableElementPopUp
                    elementId={product.product_id || 0}
                    queryKey={["products"]}
                    deleteFn={deleteProduct}
                    elementName={product.product_name}
                    successMsgTitle="Producto eliminado"
                    successMsgDescription={`El producto "${product.product_name}" ha sido eliminado.`}
                    errorMsgTitle="Error al eliminar producto"
                    errorMsgDescription={`No se pudo eliminar el producto "${product.product_name}".`}
                  />
                </div>
              </TableCell>
              <TableCell>{product.short_code || "-"}</TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={product.public_images?.public_image_src || ""}
                      alt={product.product_name}
                    />
                    <AvatarFallback>
                      {product.product_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.categories?.category_name}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>{product.categories?.category_name || "-"}</TableCell>
              <TableCell>{product.sub_categories?.sub_category_name || "-"}</TableCell>
              <TableCell>{product.providers?.provider_name || "-"}</TableCell>
              <TableCell>{product.brands?.brand_name || "-"}</TableCell>
              <TableCell>{product.lot || "-"}</TableCell>
              <TableCell>{product.sale_units?.sale_unit_name || "-"}</TableCell>
              <TableCell>{product.barcode || "-"}</TableCell>

              

              <TableCell className="text-center flex flex-col">
                {product.stock?.quantity}
                <span className="text-sm text-muted-foreground">
                  {" "}
                  (min {product.stock?.min} / max {product.stock?.max})
                </span>
                Control de stock: {product.allow_stock_control ? "Sí" : "No"}
              </TableCell>

              <TableCell className="text-right font-medium">
                {product.prices && product.prices.length > 0
                  ? product.prices
                      .map(
                        (price) =>
                          `${price.quantity} x $${price.price}${
                            price.isPromo ? " (Promo)" : ""
                          }`
                      )
                      .join(", ")
                  : "-"}
              </TableCell>

              <TableCell>
                  <span className="text-sm text-muted-foreground">
                  {" "}
                  (min {product.stock?.min} / max {product.stock?.max})
                </span>
              </TableCell>
               <TableCell className="text-center flex flex-col">
                   <span className="text-sm text-muted-foreground">

                               {product.expiration_date || "-"}
                   </span>
 Notifaciones: {product.expiration_date_notification ? "Sí" : "No"}
              </TableCell>

              <TableCell>{product.bulk || "-"}</TableCell>
              <TableCell>{product.waste || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
