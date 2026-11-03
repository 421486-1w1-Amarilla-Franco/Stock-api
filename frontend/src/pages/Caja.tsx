import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useCaja, useCierres, useCerrarCaja } from '../hooks/useTaller';
import ConfirmModal from '../components/ConfirmModal';
import { useApp } from '../lib/app-context';
import { apiError } from '../lib/errors';
import { fmtARS, isoDate } from '../lib/format';
import { MEDIOS_PAGO } from '../types/api';

const fechaLarga = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export default function Caja() {
  const { toast } = useApp();
  const hoy = isoDate(new Date());
  const [fecha, setFecha] = useState(hoy);
  const { data: caja, isLoading } = useCaja(fecha);
  const { data: cierres = [] } = useCierres();
  const cerrar = useCerrarCaja();
  const [contado, setContado] = useState('');
  const [obs, setObs] = useState('');
  const [confirm, setConfirm] = useState(false);

  const efectivo = caja?.totalesPorMedio.EFECTIVO ?? 0;
  const contadoNum = contado === '' ? null : Math.max(0, Number(contado) || 0);
  const diferencia = contadoNum === null ? null : contadoNum - efectivo;

  const confirmar = () => {
    if (contadoNum === null) return;
    cerrar.mutate({ fecha, efectivoContado: contadoNum, observaciones: obs.trim() || undefined }, {
      onSuccess: () => { toast('success', `Caja del ${fechaLarga(fecha)} cerrada`); setContado(''); setObs(''); setConfirm(false); },
      onError: (err) => { setConfirm(false); toast('error', apiError(err, 'No se pudo cerrar la caja')); },
    });
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Caja</h1>
          <p className="page-sub">Lo cobrado por medio de pago y el cierre del día contra el efectivo contado.</p>
        </div>
        <div className="page-actions">
          <label className="inline-field">
            <span>Día</span>
            <input type="date" className="input" value={fecha} max={hoy} onChange={(e) => e.target.value && setFecha(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-5">
        {MEDIOS_PAGO.map((m) => (
          <div key={m.id} className="kpi-card">
            <span className="kpi-label">{m.label}</span>
            <div className="kpi-value">{isLoading ? '—' : fmtARS(caja?.totalesPorMedio[m.id] ?? 0)}</div>
          </div>
        ))}
        <div className="kpi-card kpi-total">
          <span className="kpi-label">Total del día</span>
          <div className="kpi-value">{isLoading ? '—' : fmtARS(caja?.total ?? 0)}</div>
          <div className="kpi-foot"><span className="kpi-sub">{caja?.cantidadVentas ?? 0} venta{caja?.cantidadVentas === 1 ? '' : 's'}</span></div>
        </div>
      </div>

      <section className="card caja-cierre">
        {caja?.cierre ? (
          <>
            <div className="card-head">
              <div>
                <h2 className="card-title"><Lock size={14} aria-hidden="true" /> Caja cerrada</h2>
                <div className="card-sub">Por {caja.cierre.usuarioNombre} · {new Date(caja.cierre.creadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} h. Ya no se registran ni anulan ventas de este día.</div>
              </div>
            </div>
            <dl className="caja-resumen">
              <div><dt>Efectivo esperado</dt><dd className="num">{fmtARS(caja.cierre.totalEfectivo)}</dd></div>
              <div><dt>Efectivo contado</dt><dd className="num">{fmtARS(caja.cierre.efectivoContado)}</dd></div>
              <div><dt>Diferencia</dt><dd className={`num ${caja.cierre.diferencia < 0 ? 'text-danger' : caja.cierre.diferencia > 0 ? 'text-ok' : ''}`}>{fmtARS(caja.cierre.diferencia)}</dd></div>
            </dl>
            {caja.cierre.observaciones && <p className="venta-detail-obs">{caja.cierre.observaciones}</p>}
          </>
        ) : (
          <>
            <div className="card-head">
              <div>
                <h2 className="card-title">Cerrar caja · {fechaLarga(fecha)}</h2>
                <div className="card-sub">Contá el efectivo del cajón. Al cerrar, el día queda congelado.</div>
              </div>
            </div>
            <div className="caja-form">
              <label className="field">
                <span className="field-label">Efectivo contado</span>
                <div className="field-control has-prefix">
                  <span className="field-prefix">$</span>
                  <input className="input input-lg" type="number" min="0" inputMode="decimal" value={contado}
                    onChange={(e) => setContado(e.target.value)} placeholder={String(Math.round(efectivo))} />
                </div>
              </label>
              <div className="field">
                <span className="field-label">Diferencia</span>
                <div className={`caja-diff num ${diferencia === null ? 'muted' : diferencia < 0 ? 'text-danger' : diferencia > 0 ? 'text-ok' : ''}`} aria-live="polite">
                  {diferencia === null ? '—' : diferencia === 0 ? 'Cierra justo' : `${diferencia > 0 ? 'Sobran' : 'Faltan'} ${fmtARS(Math.abs(diferencia))}`}
                </div>
              </div>
              <label className="field caja-obs">
                <span className="field-label">Observaciones</span>
                <input className="input" value={obs} onChange={(e) => setObs(e.target.value)} maxLength={255} placeholder="Opcional" />
              </label>
              <button className="btn btn-primary" disabled={contadoNum === null || cerrar.isPending} onClick={() => setConfirm(true)}>
                <Lock size={14} aria-hidden="true" /> Cerrar caja
              </button>
            </div>
          </>
        )}
      </section>

      <section className="card no-pad">
        <div className="card-head">
          <div>
            <h2 className="card-title">Cierres anteriores</h2>
            <div className="card-sub">Últimos 60 días cerrados</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col" style={{ textAlign: 'right' }}>Ventas</th>
                <th scope="col" style={{ textAlign: 'right' }}>Efectivo</th>
                <th scope="col" style={{ textAlign: 'right' }}>Otros medios</th>
                <th scope="col" style={{ textAlign: 'right' }}>Contado</th>
                <th scope="col" style={{ textAlign: 'right' }}>Diferencia</th>
                <th scope="col">Cerró</th>
              </tr>
            </thead>
            <tbody>
              {cierres.length === 0 && <tr><td colSpan={7} className="card-empty">Todavía no hay cierres.</td></tr>}
              {cierres.map((c) => (
                <tr key={c.id} className="table-clickable" onClick={() => setFecha(c.fecha)}>
                  <td>{fechaLarga(c.fecha)}</td>
                  <td className="td-num">{c.cantidadVentas}</td>
                  <td className="td-num">{fmtARS(c.totalEfectivo)}</td>
                  <td className="td-num td-muted">{fmtARS(c.totalDebito + c.totalCredito + c.totalTransferencia)}</td>
                  <td className="td-num">{fmtARS(c.efectivoContado)}</td>
                  <td className={`td-num ${c.diferencia < 0 ? 'is-neg' : c.diferencia > 0 ? 'is-pos' : ''}`}>{fmtARS(c.diferencia)}</td>
                  <td className="td-muted">{c.usuarioNombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={confirm}
        title={`¿Cerrar la caja del ${fechaLarga(fecha)}?`}
        description={`Efectivo esperado ${fmtARS(efectivo)}, contado ${fmtARS(contadoNum ?? 0)}. Después del cierre no se pueden registrar ni anular ventas de ese día.`}
        confirmLabel="Cerrar caja"
        onConfirm={confirmar}
        onCancel={() => setConfirm(false)}
      />
    </main>
  );
}
