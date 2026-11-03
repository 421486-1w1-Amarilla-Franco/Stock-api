import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBajoStock, useResumen } from '../hooks/useDashboard';
import { useMovimientos } from '../hooks/useMovimientos';
import KpiCards from '../components/KpiCards';
import SalesChart from '../components/SalesChart';
import LowStock from '../components/LowStock';
import RecentMovements from '../components/RecentMovements';
import TopProducts from '../components/TopProducts';
import { useApp } from '../lib/app-context';
import { fmtARS } from '../lib/format';

export default function Dashboard() {
  const { user, openMovimiento } = useApp();
  const navigate = useNavigate();
  const { data: r, isLoading, isError, dataUpdatedAt } = useResumen(30);
  const { data: bajoStock = [], isLoading: loadingBajo } = useBajoStock();
  const { data: movs, isLoading: loadingMov } = useMovimientos({ size: 10 });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buen día' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }, []);

  const ticket = (v: number, n: number) => (n > 0 ? v / n : 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting}, {user.nombre.split(' ')[0]}.</h1>
          <p className="page-sub">
            {r ? (
              <>Hoy: <strong>{r.ventasHoy} venta{r.ventasHoy === 1 ? '' : 's'}</strong> por <strong>{fmtARS(r.montoHoy)}</strong>
                {r.productosBajoStock > 0 && <> · <strong>{r.productosBajoStock}</strong> producto{r.productosBajoStock === 1 ? '' : 's'} para reponer</>}.</>
            ) : ' '}
          </p>
        </div>
        <div className="page-meta" aria-live="polite">
          <div className="meta-block">
            <div className="meta-label">Período</div>
            <div className="meta-value">Últimos 30 días</div>
          </div>
          <div className="meta-divider" />
          <div className="meta-block">
            <div className="meta-label">Actualizado</div>
            <div className="meta-value">
              <span className={`pulse${isError ? ' is-warn' : ''}`} aria-hidden="true" />
              {isError ? 'Sin conexión' : dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
        </div>
      </div>

      <KpiCards
        isLoading={isLoading}
        cards={r ? [
          { label: 'Ventas', value: fmtARS(r.ventas), delta: { actual: r.ventas, anterior: r.ventasAnterior }, sub: `${r.transacciones} venta${r.transacciones === 1 ? '' : 's'}`, onClick: () => navigate('/ventas') },
          { label: 'Ganancia bruta', value: fmtARS(r.margen), delta: { actual: r.margen, anterior: r.margenAnterior }, sub: r.ventas > 0 ? `${Math.round((r.margen / r.ventas) * 100)}% sobre ventas` : 'ventas − costo de mercadería' },
          { label: 'Ticket promedio', value: fmtARS(ticket(r.ventas, r.transacciones)), delta: { actual: ticket(r.ventas, r.transacciones), anterior: ticket(r.ventasAnterior, r.transaccionesAnterior) }, sub: 'por venta' },
          { label: 'Para reponer', value: String(r.productosBajoStock), warn: r.productosBajoStock > 0, sub: `inventario ${fmtARS(r.valorInventarioCosto)} al costo`, onClick: () => navigate('/compras') },
        ] : []}
      />

      <div className="grid-2">
        <SalesChart data={r?.ventasDiarias ?? []} isLoading={isLoading} />
        <LowStock
          productos={bajoStock}
          isLoading={loadingBajo}
          onAddStock={(id) => openMovimiento(id, 'ENTRADA')}
          onVerTodos={() => navigate('/compras')}
        />
      </div>

      <div className="grid-2 grid-2-alt">
        <RecentMovements movimientos={movs?.content ?? []} isLoading={loadingMov} onVerTodos={() => navigate('/movimientos')} />
        <TopProducts productos={r?.productosMasVendidos ?? []} isLoading={isLoading} />
      </div>
    </main>
  );
}
