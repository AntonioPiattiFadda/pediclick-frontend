
export const validateItemsBeforeUpdate = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transferOrderItems: any[]
) => {
    console.log("⚠️ Validating items before update:", transferOrderItems);
    for (const item of transferOrderItems) {
        const index = transferOrderItems.indexOf(item) + 1;
        if (!item.product_id) {
            throw new Error(`El producto de la linea ${index} no tiene un producto seleccionado.`);
        }
        if (!item.product_presentation_id) {
            throw new Error(`El producto de la linea ${index} no tiene una presentación seleccionada.`);
        }
        if (item.quantity <= 0) {
            throw new Error(`La cantidad del producto de la linea ${index} debe ser mayor a cero.`);
        }
    }
}