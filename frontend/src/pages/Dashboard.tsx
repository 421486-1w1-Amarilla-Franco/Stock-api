import { useMemo, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStock, useBajoStock, useMovimientos, useReporteVentas, useVentas } from '../hooks/useDashboard';
import KpiCards from '../components/KpiCards';
import SalesChart from '../components/SalesChart';
import LowStock from '../components/LowStock';
import RecentMovements from '../components/RecentMovements';
import TopProducts from '../components/TopProducts';
import type { AuthUser } from '../types/api';

interface DashboardProps {
  user: AuthUser | null;
  syncStatus: 'ok' | 'warn';
  onAddStock?: (productoId: number) => void;
}

export default function Dashboard({ user, syncStatus, onAddStock }: DashboardProps) {
  const today = useMemo(() => new Date(), []);
  const thirtyAgo = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d;
  }, [today]);

  const { data: stock, isLoading: loadingStock } = useStock();
  const { data: bajoStock, isLoading: loadingBajoStock } = useBajoStock();
  const { data: movimientos, isLoading: loadingMov } = useMovimientos();
  const { data: reporte, isLoading: loadingReporte } = useReporteVentas(thirtyAgo, today);
  const { data: ventas, isLoading: loadingVentas } = useVentas();

  const valorInventario = useMemo(() => {
    if (!stock) return 0;
    return stock.reduce((s, p) => s + (p.precioVenta ?? 0) * (p.stockActual ?? 0), 0);
  }, [stock]);

  const ventasHoy = useMemo(() => {
    if (!ventas) return 0;
    const hoy = new Date().toDateString();
    return ventas.filter((v) => new Date(v.fecha).toDateString() === hoy).length;
  }, [ventas]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buen día';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const [syncSecs, setSyncSecs] = useState(0);
  useEffect(() => {
    setSyncSecs(0);
    const t = setInterval(() => setSyncSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [stock, bajoStock, movimientos, reporte, ventas]);

  const syncLabel = syncSecs < 60
    ? `hace ${syncSecs} s`
    : `hace ${Math.floor(syncSecs / 60)} min`;

  const firstName = user?.nombre?.split(' ')[0] ?? 'Admin';
  const isLoading = loadingStock || loadingBajoStock || loadingMov || loadingReporte || loadingVentas;

  return (
    <main className="page">
      {/* Page header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Resumen</div>
          <h1 className="page-title">{greeting}, {firstName}.</h1>
          <p className="page-sub">
            Tenés{' '}
            <strong>{ventasHoy} venta{ventasHoy === 1 ? '' : 's'} hoy</strong> y{' '}
            <strong>{bajoStock?.length ?? 0} productos</strong> bajo stock mínimo.
          </p>
        </div>
        <div className="page-meta">
          <div className="meta-block">
            <div className="meta-label">Período</div>
            <button className="meta-pill" type="button">
              Últimos 30 días
              <ChevronDown size={12} strokeWidth={2} />
            </button>
          </div>
          <div className="meta-divider" />
          <div className="meta-block">
            <div className="meta-label">Última sincronía</div>
            <div className="meta-value">
              <span className={`pulse${syncStatus === 'warn' ? ' is-warn' : ''}`} />
              {syncLabel}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <KpiCards
        valorInventario={valorInventario}
        ventasMes={reporte?.totalVentas ?? 0}
        bajoStockCount={bajoStock?.length ?? 0}
        ventasHoy={ventasHoy}
        ventasDiarias={reporte?.ventasDiarias ?? []}
        isLoading={isLoading}
      />

      {/* Sales chart + Low stock */}
      <div className="grid-2">
        <SalesChart
          data={reporte?.ventasDiarias ?? []}
          isLoading={loadingReporte}
        />
        <LowStock
          productos={bajoStock ?? []}
          isLoading={loadingBajoStock}
          onAddStock={onAddStock}
        />
      </div>

      {/* Recent movements + Top products */}
      <div className="grid-2 grid-2-alt">
        <RecentMovements
          movimientos={movimientos ?? []}
          isLoading={loadingMov}
        />
        <TopProducts
          productos={reporte?.productosMasVendidos ?? []}
          isLoading={loadingReporte}
        />
      </div>

      {/* Footer */}
      <footer className="page-foot">
        <span>Stock API · v0.1 · taller@avmitre.com.ar</span>
        <span>Sincroniza cada 30 s · SQL Server stock_db</span>
      </footer>
    </main>
  );
}
