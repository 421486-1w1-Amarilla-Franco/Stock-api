export const fmtARS = (n: number): string =>
  '$' + Math.round(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });

export const fmtNum = (n: number): string => n.toLocaleString('es-AR');

export const tiempoRelativo = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
};

export const initials = (name: string): string =>
  name
    .split(' ')
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const dateLabel = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

export const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '');
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};

export const fmtDateTimeFull = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
