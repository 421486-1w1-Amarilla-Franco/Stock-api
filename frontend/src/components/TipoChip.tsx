import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function TipoChip({ tipo }: { tipo: string }) {
  const map: Record<string, { cls: string; Icon: React.ElementType; label: string }> = {
    ENTRADA: { cls: 'tipo-in',  Icon: ArrowUp,   label: 'Entrada' },
    SALIDA:  { cls: 'tipo-out', Icon: ArrowDown,  label: 'Salida'  },
    AJUSTE:  { cls: 'tipo-adj', Icon: Minus,      label: 'Ajuste'  },
  };
  const m = map[tipo] ?? map.AJUSTE;
  return (
    <span className={`tipo-chip ${m.cls}`}>
      <m.Icon size={10} strokeWidth={2.2} />
      {m.label}
    </span>
  );
}
