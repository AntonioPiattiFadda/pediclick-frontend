import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { checkIfShortCodeIsAvailable } from "@/service/products";

type ShortCodeStatus = "idle" | "loading" | "available" | "unavailable" | "error";

type Props = {
    value: number | null;
    onChange: (value: number | undefined) => void;
    productId?: number;
    onStatusChange?: (status: ShortCodeStatus) => void;
};

const ShortCodeSelector = ({ value, onChange, productId, onStatusChange }: Props) => {
    const [status, setStatus] = useState<ShortCodeStatus>("idle");
    const [helpText, setHelpText] = useState<string | null>(null);
    const [currentProductName, setCurrentProductName] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    useEffect(() => {
        onStatusChange?.(status);
    }, [status, onStatusChange]);

    useEffect(() => {
        // Reset when empty/invalid
        if (value === null || Number.isNaN(value)) {
            requestIdRef.current++;
            setStatus("idle");
            setHelpText(null);
            setCurrentProductName(null);
            return;
        }

        setStatus("loading");
        setHelpText(null);
        setCurrentProductName(null);

        const currentRequestId = ++requestIdRef.current;

        const timer = setTimeout(async () => {
            try {
                const { isAvailable, products } = await checkIfShortCodeIsAvailable(Number(value), productId);

                if (currentRequestId !== requestIdRef.current) return;

                const productNames = products.map((p: { product_name: string }) => p.product_name).join(", ");
                setCurrentProductName(productNames ?? null);

                if (isAvailable) {
                    setStatus("available");
                    setHelpText("El código corto está disponible");
                } else {
                    setStatus("unavailable");
                    setHelpText("Código asignado a: ");
                }
            } catch {
                if (currentRequestId !== requestIdRef.current) return;
                setStatus("error");
                setHelpText("Error al verificar la disponibilidad del código corto");
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, productId]);

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor="short_code">Código corto</Label>
            <Input
                id="short_code"
                type="number"
                placeholder="Código corto"
                value={value ?? undefined}
                onChange={(e) => {
                    const newValue = e.target.value;
                    onChange(newValue === "" ? undefined : (Number(newValue)));
                }}
            />

            <div className="min-h-5 text-sm">
                {status === "loading" && (
                    <div className="flex items-center text-gray-500">
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                        Chequeando disponibilidad...
                    </div>
                )}

                {status === "available" && (
                    <div className="flex items-center text-green-600">
                        <span className="mr-2">✓</span>
                        {helpText}
                    </div>
                )}

                {status === "unavailable" && (
                    <div className="flex items-center text-red-600">
                        <span className="mr-2">✕</span>
                        <span>{helpText}</span>
                        {currentProductName && (
                            <span className="ml-1 font-medium">{currentProductName}</span>
                        )}
                    </div>
                )}

                {status === "error" && (
                    <div className="text-red-600">{helpText}</div>
                )}
            </div>
        </div>
    );
};

export default ShortCodeSelector;