import type { TaxConditionType } from "@/types/clients";

export const taxConditionsOpt: { value: TaxConditionType; label: string }[] = [
    { value: "VAT_REGISTERED_RESPONSIBLE", label: "IVA Responsable Inscripto" },
    { value: "VAT_EXEMPT_SUBJECT", label: "IVA Sujeto Exento" },
    { value: "FINAL_CONSUMER", label: "Consumidor Final" },
    { value: "MONOTAX_RESPONSIBLE", label: "Responsable Monotributo" },
    { value: "UNCATEGORIZED_SUBJECT", label: "Sujeto No Categorizado" },
    { value: "FOREIGN_SUPPLIER", label: "Proveedor del Exterior" },
    { value: "FOREIGN_CLIENT", label: "Cliente del Exterior" },
    { value: "VAT_LIBERATED_LAW_19640", label: "IVA Liberado - Ley Nº 19.640" },
    { value: "SOCIAL_MONOTAX", label: "Monotributista Social" },
    { value: "VAT_NOT_REACHED", label: "IVA No Alcanzado" },
    {
        value: "PROMOTED_INDEPENDENT_MONOTAX_WORKER",
        label: "Monotributista Trabajador Independiente Promovido",
    },
];

export const transferOrderStatuses = {
    PENDING: "Pendiente",
    IN_TRANSIT: "En Tránsito",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
} as const;