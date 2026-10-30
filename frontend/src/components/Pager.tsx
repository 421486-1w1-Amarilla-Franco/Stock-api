import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Page } from '../types/api';

/** Pie de tabla paginada: "1–50 de 312" + anterior/siguiente. */
export default function Pager<T>({ page, onPage, noun }: { page: Page<T>; onPage: (p: number) => void; noun: string }) {
  const from = page.totalElements === 0 ? 0 : page.page * page.size + 1;
  const to = page.page * page.size + page.content.length;
  return (
    <div className="table-foot pager">
      <span>{page.totalElements === 0 ? `0 ${noun}` : `${from}–${to} de ${page.totalElements} ${noun}`}</span>
      {page.totalPages > 1 && (
        <div className="pager-btns">
          <button className="btn btn-ghost btn-sm" onClick={() => onPage(page.page - 1)} disabled={page.page === 0}>
            <ChevronLeft size={14} aria-hidden="true" /> Anterior
          </button>
          <span className="pager-pos">{page.page + 1} / {page.totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onPage(page.page + 1)} disabled={page.page + 1 >= page.totalPages}>
            Siguiente <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
