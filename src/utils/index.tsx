export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "CNY":
      return "¥";
    case "ARG":
      return "$";
    default:
      return currency; // Return the currency code if no symbol is found
  }
};

export const toLocalIsoString = (isoString: string): string => {
  if (!isoString) return "--";
  const date = new Date(isoString);
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in ms
  const localISO = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, -1);
  return localISO;
};

export const formatDateToDDMMYY = (isoString: string): string => {
  if (!isoString) return "--";
  const localeDateIso = toLocalIsoString(isoString);
  const day = localeDateIso.slice(8, 10);
  const month = localeDateIso.slice(5, 7);
  const year = localeDateIso.slice(0, 4);
  return `${day}/${month}/${year}`;
};

export const formatDateToDDMMYYHHMM = (isoString: string): string => {
  if (!isoString) return "--";
  const localeDateIso = toLocalIsoString(isoString);

  const day = localeDateIso.slice(8, 10);
  const month = localeDateIso.slice(5, 7);
  const year = localeDateIso.slice(0, 4);
  const hour = localeDateIso.slice(11, 13);
  const minutes = localeDateIso.slice(14, 16);
  return `${day}/${month}/${year} ${hour}:${minutes}`;
};

export function formatDate(value?: string) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "numeric" });
  } catch {
    return value;
  }
}

export function formatSmartNumber(num: number): number {
  if (num == null || isNaN(num)) return 0;

  const rounded = Math.round(num * 100) / 100; // redondea a 2 decimales
  const fixed = rounded.toFixed(2); // "423.00" o "423.40"

  // Si termina en .00 → convertir a entero
  if (fixed.endsWith(".00")) return parseInt(fixed, 10);

  // Si tiene decimales, eliminar ceros y punto final si hace falta
  return parseFloat(fixed.replace(/0+$/, "").replace(/\.$/, ""));
}

export function createClientKey(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function sliceLongNames(maxLength: number = 30, name?: string) {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 3) + '...';
}

let tempIdCounter = 0;

export const generateTempNumericId = () => {
  tempIdCounter += 1;
  return Date.now() * 1000 + tempIdCounter;
};