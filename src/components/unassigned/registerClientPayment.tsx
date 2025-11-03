import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { supabase } from "@/service";

// Tipo de transacción
type ClientTransaction = {
    transaction_id: string;
    client_id: string;
    order_id?: string;
    transaction_type: string;
    amount: number;
    description?: string;
    created_at: string;
};

// Función para insertar la transacción en Supabase
async function createClientTransaction(data: ClientTransaction) {
    const { error } = await supabase.from("client_transactions").insert(data);
    if (error) throw error;
    return data;
}

const RegisterClientPayment = ({
    clientId,
    clientName,
    currentBalance,
}: {
    clientId: string;
    clientName: string;
    currentBalance: number;
}) => {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [open, setOpen] = useState(false);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createClientTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client_transactions"] });
            toast("Pago registrado", {
                description: "La transacción se registró correctamente.",
            });
            setAmount("");
            setDescription("");
            setOpen(false);
        },
        onError: () => {
            toast("Error al registrar el pago", {
                description: "Intentá nuevamente más tarde.",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        const newTransaction: ClientTransaction = {
            transaction_id: nanoid(),
            client_id: clientId,
            transaction_type: "payment",
            amount: parseFloat(amount),
            description: description || undefined,
            created_at: new Date().toISOString(),
        };

        mutation.mutate(newTransaction);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Registrar Pago</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogDescription>
                        Cliente: <strong>{clientName}</strong> <br />
                        Saldo actual: <strong>${currentBalance.toFixed(2)}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="amount">Monto</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="Ingrese monto"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="description">Descripción (opcional)</Label>
                        <Input
                            id="description"
                            type="text"
                            placeholder="Ej: Pago en efectivo"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isLoading}>
                            {mutation.isLoading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterClientPayment;
