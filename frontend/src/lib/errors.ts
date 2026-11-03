/** Mensaje del backend ({ mensaje }) o un texto por defecto. */
export const apiError = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? fallback;
