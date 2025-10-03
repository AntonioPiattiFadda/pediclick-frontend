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