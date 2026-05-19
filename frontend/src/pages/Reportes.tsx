import { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { useReporteVentas, useStock } from '../hooks/useDashboard';
import SalesChart from '../components/SalesChart';
import { fmtARS, fmtNum } from '../lib/format';
import { exportCSV } from '../lib/export';

type Preset = '7d' | '30d' | '90d' | 'mes';

function toStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fromStr(s: string): Date {
  return new Date(s + 'T00:00:00');
}

function presetRange(p: Preset): [Date, Date] {
  const hasta = new Date();
  const desde = new Date();
  if (p === '7d')  desde.setDate(hasta.getDate() - 6);
  else if (p === '30d') desde.setDate(hasta.getDate() - 29);
  else if (p === '90d') desde.setDate(hasta.getDate() - 89);
  else desde.setDate(1); // este mes
  return [desde, hasta];
}

export default function Reportes() {
  const [preset, setPreset] = useState<Preset>('30d');
  const [[desde, hasta], setRange] = useState<[Date, Date]>(() => presetRange('30d'));

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setRange(presetRange(p));
  };

  const { data: reporte, isLoading: loadingReporte, isError: errorReporte, refetch: refetchReporte } = useReporteVentas(desde, hasta);
  const { data: stock = [], isLoading: loadingStock, isError: errorStock, refetch: refetchStock } = useStock();

  const valorInventario = useMemo(
    () => stock.reduce((s, p) => s + Number(p.precioVenta ?? 0) * (p.stockActual ?? 0), 0),
    [stock],
  );

  const promedio = useMemo(() => {
    if (!reporte?.cantidadTransacciones) return 0;
    return reporte.totalVentas / reporte.cantidadTransacciones;
  }, [reporte]);

  const PRESETS: { id: Preset; label: string }[] = [
    { id: '7d', label: '7 días' },
    { id: '30d', label: '30 días' },
    { id: '90d', label: '3 meses' },
    { id: 'mes', label: 'Este mes' },
  ];

  return (
    <main className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Análisis</div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">
            {reporte
              ? `${fmtNum(reporte.cantidadTransacciones)} transacciones · Total ${fmtARS(reporte.totalVentas)}`
              : 'Seleccioná un período para ver los datos.'}
          </p>
        </div>

        {/* Range selector */}
        <div className="page-meta">
          <div className="meta-block">
            <div className="meta-label">Período</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="date"
                className="input"
                style={{ width: 140, fontSize: 13, padding: '5px 8px' }}
                value={toStr(desde)}
                max={toStr(hasta)}
                onChange={(e) => { setPreset('30d'); setRange([fromStr(e.target.value), hasta]); }}
              />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>→</span>
              <input
                type="date"
                className="input"
                style={{ width: 140, fontSize: 13, padding: '5px 8px' }}
                value={toStr(hasta)}
                min={toStr(desde)}
                onChange={(e) => { setPreset('30d'); setRange([desde, fromStr(e.target.value)]); }}
              />
            </div>
          </div>
          <div className="meta-divider" />
          <div className="seg">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`seg-btn${preset === p.id ? ' is-active' : ''}`}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        {loadingReporte || loadingStock
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi-card">
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
                <div className="skeleton" style={{ height: 32, width: '80%', marginTop: 4 }} />
                <div className="skeleton" style={{ height: 12, width: '50%', marginTop: 'auto' }} />
              </div>
            ))
          : (
            <>
              <div className="kpi-card kpi-card--accent">
                <div className="kpi-head">
                  <div className="kpi-label">Total ventas</div>
                </div>
                <div className="kpi-value">{fmtARS(reporte?.totalVentas ?? 0)}</div>
                <div className="kpi-foot"><span className="kpi-sub">en el período</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-label">Transacciones</div>
                </div>
                <div className="kpi-value">{fmtNum(reporte?.cantidadTransacciones ?? 0)}</div>
                <div className="kpi-foot"><span className="kpi-sub">ventas registradas</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-label">Promedio por venta</div>
                </div>
                <div className="kpi-value">{fmtARS(promedio)}</div>
                <div className="kpi-foot"><span className="kpi-sub">ticket promedio</span></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-head">
                  <div className="kpi-label">Valor de inventario</div>
                </div>
                <div className="kpi-value">{fmtARS(valorInventario)}</div>
                <div className="kpi-foot"><span className="kpi-sub">stock actual × precio venta</span></div>
              </div>
            </>
          )}
      </div>

      {/* Gráfico de ventas */}
      <SalesChart
        data={reporte?.ventasDiarias ?? []}
        isLoading={loadingReporte}
      />

      {/* Top productos + Inventario actual */}
      <div className="grid-2">
        {/* Top productos */}
        <div className="card no-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Productos más vendidos</div>
              <div className="card-sub">Por unidades e ingresos en el período</div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => exportCSV('top-productos', (reporte?.productosMasVendidos ?? []).map((p) => ({
                nombre: p.nombre,
                unidades: p.cantidadVendida,
                ingresos: p.ingresos,
              })), [
                { key: 'nombre', header: 'Producto' },
                { key: 'unidades', header: 'Unidades vendidas' },
                { key: 'ingresos', header: 'Ingresos' },
              ])}
            >
              <Download size={12} strokeWidth={1.8} />
              CSV
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: 36 }}>#</th>
                  <th scope="col">Producto</th>
                  <th scope="col" style={{ width: 100, textAlign: 'right' }}>Unidades</th>
                  <th scope="col" style={{ width: 130, textAlign: 'right' }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {loadingReporte && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: 14, width: 20 }} /></td>
                    <td><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                    <td className="td-num"><div className="skeleton" style={{ height: 14, width: 50, marginLeft: 'auto' }} /></td>
                    <td className="td-num"><div className="skeleton" style={{ height: 14, width: 80, marginLeft: 'auto' }} /></td>
                  </tr>
                ))}
                {errorReporte && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <div className="empty-title" style={{ color: 'var(--danger)' }}>Error al cargar</div>
                      <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => refetchReporte()}>Reintentar</button>
                    </td>
                  </tr>
                )}
                {!loadingReporte && !errorReporte && (reporte?.productosMasVendidos ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <div className="empty-title">Sin ventas en el período</div>
                    </td>
                  </tr>
                )}
                {!loadingReporte && !errorReporte && (reporte?.productosMasVendidos ?? []).map((p, i) => (
                  <tr key={p.nombre}>
                    <td className="td-id td-muted">{i + 1}</td>
                    <td><span className="td-product-name">{p.nombre}</span></td>
                    <td className="td-num">{fmtNum(p.cantidadVendida)}</td>
                    <td className="td-num"><strong>{fmtARS(p.ingresos)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventario actual */}
        <div className="card no-pad">
          <div className="card-head">
            <div>
              <div className="card-title">Inventario actual</div>
              <div className="card-sub">{stock.filter((p) => p.activo).length} productos activos</div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => exportCSV('inventario', stock.filter((p) => p.activo).map((p) => ({
                nombre: p.nombre,
                codigo: p.codigo ?? '',
                categoria: p.categoria,
                stockActual: p.stockActual,
                stockMinimo: p.stockMinimo,
                precioVenta: p.precioVenta,
                valor: Number(p.precioVenta ?? 0) * (p.stockActual ?? 0),
              })), [
                { key: 'nombre', header: 'Nombre' },
                { key: 'codigo', header: 'Código' },
                { key: 'categoria', header: 'Categoría' },
                { key: 'stockActual', header: 'Stock actual' },
                { key: 'stockMinimo', header: 'Stock mínimo' },
                { key: 'precioVenta', header: 'Precio venta' },
                { key: 'valor', header: 'Valor en inventario' },
              ])}
            >
              <Download size={12} strokeWidth={1.8} />
              CSV
            </button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col" style={{ width: 110, textAlign: 'right' }}>Stock</th>
                  <th scope="col" style={{ width: 130, textAlign: 'right' }}>Precio venta</th>
                  <th scope="col" style={{ width: 130, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {loadingStock && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ height: 14, width: '70%' }} /></td>
                    <td className="td-num"><div className="skeleton" style={{ height: 14, width: 50, marginLeft: 'auto' }} /></td>
                    <td className="td-num"><div className="skeleton" style={{ height: 14, width: 80, marginLeft: 'auto' }} /></td>
                    <td className="td-num"><div className="skeleton" style={{ height: 14, width: 80, marginLeft: 'auto' }} /></td>
                  </tr>
                ))}
                {errorStock && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <div className="empty-title" style={{ color: 'var(--danger)' }}>Error al cargar</div>
                      <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => refetchStock()}>Reintentar</button>
                    </td>
                  </tr>
                )}
                {!loadingStock && !errorStock && stock.filter((p) => p.activo).map((p) => {
                  const valor = Number(p.precioVenta ?? 0) * (p.stockActual ?? 0);
                  const bajo = p.stockActual <= p.stockMinimo;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="td-product">
                          <span className="td-product-name">{p.nombre}</span>
                          {p.codigo && <span className="td-product-code">{p.codigo}</span>}
                        </div>
                      </td>
                      <td className="td-num">
                        <span className={bajo ? 'is-neg' : ''}>{p.stockActual}</span>
                        <span className="stock-min"> / {p.stockMinimo}</span>
                      </td>
                      <td className="td-num td-muted">{fmtARS(Number(p.precioVenta))}</td>
                      <td className="td-num"><strong>{fmtARS(valor)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loadingStock && !errorStock && (
            <div className="table-foot">
              <span>Total inventario: <strong>{fmtARS(valorInventario)}</strong></span>
            </div>
          )}
        </div>
      </div>

      <footer className="page-foot">
        <span>Stock API · Reportes</span>
        <span>Los datos se actualizan cada 30 s</span>
      </footer>
    </main>
  );
}
