export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-lg font-semibold leading-tight">{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
    );
}
