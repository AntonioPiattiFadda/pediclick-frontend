export type LoadOrder = {
  load_order_id: string;
  load_order_number: string;
  //Lo tiene el remito del proveedor
  provider_id: number;
  //   domicilio: string;
  //   cuit: string;
  // puede tener un codigo porque pueden ser muchos proveedores.
  delivery_date: string; // Auytomaticamente seleccionar la fecha de hoy sino que el cliente la pueda cambiar
  receptor_id: number | null;
  //   tiene que elegir entre los empleados o poner otro y agregar un string
  transporter_data: {
    delivery_company: string; // CHANGE TO ENGLISH
    name: string;
    licence_plate: string; // CHANGE TO ENGLISH
    // otros campos que pueda tener el transportista
  };

  delivery_price: number | null;

  assigned_to: number | null; // El lugar deposito o receptor o limbo

  invoice_number: number | null;


  //Aun no darle bola
  lots: Array<{
    // Tenemos un input de busqueda de productos que buscaran en base de datos los productos existentes y si no conicide mostrara un label que indicara que es un producto nuevo UI
    // Creara productos por detras
    // Opcion de carga corta y carga rapida UI
    lot_id: string;
    product_id: number;
    
    quantity: number;
    price: number;
  }>;
};
