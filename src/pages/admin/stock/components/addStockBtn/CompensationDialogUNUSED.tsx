// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import type { Stock } from '@/types/stocks';

// const CompensationDialog = ({ showDialog, setShowDialog, stocksWithOverSell, setStocksWithOverSell, pendingData, setPendingData, createLotMutation }: {
//     showDialog: boolean;
//     setShowDialog: (value: boolean) => void;
//     stocksWithOverSell: Stock[];
//     setStocksWithOverSell: (stocks: Stock[]) => void;
//     pendingData: { lot: any; stock: Stock[]; lotContainersStock: any[] } | null;
//     setPendingData: (data: { lot: any; stock: Stock[]; lotContainersStock: any[] } | null) => void;
//     createLotMutation: any;
// }) => {

//     return (
//         <Dialog open={showDialog} onOpenChange={setShowDialog}>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Oversell detectado</DialogTitle>
//                 </DialogHeader>

//                 {stocksWithOverSell
//                     .filter(s => s.hasOverSell)
//                     .map((stock, i) => (
//                         <div key={i} className="flex justify-between items-center py-2">
//                             <span>
//                                 Location {stock.location_id} — Qty {stock.quantity}
//                             </span>

//                             <Button
//                                 variant={stock.hasToCompensate ? "default" : "outline"}
//                                 onClick={() =>
//                                     setStocksWithOverSell(prev =>
//                                         prev.map((s, idx) =>
//                                             idx === i
//                                                 ? { ...s, hasToCompensate: !s.hasToCompensate }
//                                                 : s
//                                         )
//                                     )
//                                 }
//                             >
//                                 {stock.hasToCompensate ? "Compensar" : "No compensar"}
//                             </Button>
//                         </div>
//                     ))}

//                 <Button
//                     className="w-full mt-4"
//                     onClick={() => {
//                         if (!pendingData) return;

//                         createLotMutation.mutate({
//                             ...pendingData,
//                             stock: stocksWithOverSell,
//                         });

//                         setShowDialog(false);
//                         setPendingData(null);
//                     }}
//                 >
//                     Continuar
//                 </Button>
//             </DialogContent>
//         </Dialog>

//     )
// }

// export default CompensationDialog