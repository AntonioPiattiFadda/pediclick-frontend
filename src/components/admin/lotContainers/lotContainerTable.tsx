
const LotContainerTable = () => {


    return (
        <div className="rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Cantidad total</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loadOrderData.length > 0 ? (
                        loadOrderData.map(({ lot, stocks, totalQty }) => {
                            console.log("Rendering lot:", lot.purchase_cost_per_unit);
                            const hasStock = stocks.length > 0;
                            const isExpanded = !!(lot.lot_id && expandedLots[lot.lot_id]);
                            const hasCost = lot.purchase_cost_total !== null && lot.purchase_cost_total > 0;
                            return (
                                <Fragment key={lot.lot_id ?? Math.random()}>
                                    <TableRow>
                                        <TableCell className="p-0">
                                            <button
                                                type="button"
                                                className={`h-8 w-8 flex items-center justify-center rounded hover:bg-muted ${!hasStock ? "opacity-40 cursor-not-allowed" : ""}`}
                                                onClick={() => hasStock && toggleExpanded(lot.lot_id)}
                                                aria-label={isExpanded ? "Contraer" : "Expandir"}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </button>
                                        </TableCell>
                                        <TableCell className="max-w-[280px]">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{lot?.product_name || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{lot.lot_number ?? "--"}</TableCell>
                                        <TableCell>{lot.expiration_date ?? "--"}</TableCell>
                                        <TableCell>{totalQty}</TableCell>
                                        <TableCell className="text-right">
                                            <StockMovement
                                                aditionalQueryKey={["load-order", Number(loadOrderId)]}
                                                lotId={lot.lot_id ?? 0}
                                            />
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="bg-muted/30 p-0">
                                                <div className="p-3">
                                                    <div className="text-sm mb-2 font-medium">Distribución por ubicación</div>
                                                    <div className="rounded">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Ubicación</TableHead>
                                                                    <TableHead>Tipo</TableHead>
                                                                    <TableHead>Cantidad</TableHead>
                                                                    <TableHead>Precios</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {hasStock ? (
                                                                    stocks
                                                                        .sort((a, b) => a.stock_id - b.stock_id)
                                                                        .map((stockItem: Stock) => {
                                                                            console.log("Stock Item:", stockItem);
                                                                            const { typeLabel, nameLabel, isStore } = formatStockLocation(stockItem);

                                                                            return (
                                                                                <TableRow key={stockItem.stock_id}>
                                                                                    <TableCell className="max-w-[280px]">
                                                                                        <div className="flex flex-col">
                                                                                            <span>{nameLabel || typeLabel}</span>
                                                                                            {nameLabel && (
                                                                                                <span className="text-xs text-muted-foreground">{typeLabel}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </TableCell>
                                                                                    <TableCell>{typeLabel}</TableCell>
                                                                                    <TableCell>{stockItem.current_quantity}</TableCell>
                                                                                    <TableCell>{isStore ? <ManageStockPrices
                                                                                        hasCost={hasCost}
                                                                                        loadOrderId={loadOrderId}
                                                                                        storeId={stockItem.store_id || null}
                                                                                        productId={stockItem.product_id} lotNumber={lot.lot_number || 0} stockId={stockItem?.stock_id} cost_per_unit={lot?.purchase_cost_per_unit || 0} lotId={lot.lot_id || 0} /> : <span>Sin precios</span>}</TableCell>


                                                                                </TableRow>
                                                                            );
                                                                        })
                                                                ) : (
                                                                    <TableRow>
                                                                        <TableCell colSpan={3} className="text-muted-foreground">
                                                                            Sin stock asociado
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">
                                No hay lotes en este remito
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default LotContainerTable