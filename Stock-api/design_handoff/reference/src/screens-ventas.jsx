// =============================================================
// Pantalla Ventas — listado con filtro de estado + drawer detalle
// =============================================================

const EstadoChip = ({ estado }) => {
  const map = {
    ACTIVA:    { cls: "estado-done",   label: "Activa" },
    ELIMINADA: { cls: "estado-cancel", label: "Eliminada" },
  };
  const m = map[estado] || map.ACTIVA;
  return (
    <span className={`estado-chip ${m.cls}`}>
      <span className="estado-dot"/>
      {m.label}
    </span>
  );
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(".", "");
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
};

const VentaDrawer = ({ open, onClose, venta }) => {
  const stock = useStock();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  if (!venta) return null;

  const lines = venta.detalles.map(d => ({
    ...d,
    producto: stock.productoById(d.productoId),
  }));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Venta #${venta.id}`}
      subtitle={`${fmtDateTime(venta.fecha)} · ${venta.usuario}`}
      width={540}
      footer={
        venta.estado === "ACTIVA" ? (
          <>
            <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
            <button
              className="btn btn-danger"
              onClick={() => setConfirmOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Eliminar venta
            </button>
          </>
        ) : (
          <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: "auto" }}>Cerrar</button>
        )
      }
    >
      <div className="venta-detail">
        <div className="venta-detail-status">
          <EstadoChip estado={venta.estado}/>
          {venta.estado === "ELIMINADA" && (
            <span className="venta-detail-hint">Stock devuelto al inventario</span>
          )}
        </div>

        {venta.observaciones && (
          <div className="venta-detail-obs">
            <div className="venta-detail-label">Observaciones</div>
            <div>{venta.observaciones}</div>
          </div>
        )}

        <div className="venta-detail-label">Items ({lines.length})</div>
        <div className="venta-lines">
          {lines.map(l => (
            <div key={l.productoId} className="venta-line">
              <div className="venta-line-main">
                <div className="venta-line-name">{l.producto?.nombre ?? "Producto eliminado"}</div>
                <div className="venta-line-meta">
                  <span className="mono">{l.producto?.codigo}</span>
                  <span>·</span>
                  <span>{l.cantidad} × {fmtARS(l.precioUnitario)}</span>
                </div>
              </div>
              <div className="venta-line-sub">{fmtARS(l.subtotal)}</div>
            </div>
          ))}
        </div>

        <div className="venta-detail-totals">
          <div className="venta-total-row">
            <span>Subtotal</span>
            <span className="mono">{fmtARS(venta.total)}</span>
          </div>
          <div className="venta-total-row venta-total-main">
            <span>Total</span>
            <strong>{fmtARS(venta.total)}</strong>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={`Eliminar venta #${venta.id}`}
        description="La venta se marcará como eliminada y el stock volverá al inventario. Queda registro en el historial."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          stock.eliminarVenta(venta.id);
          setConfirmOpen(false);
          onClose();
        }}
      />
    </Drawer>
  );
};

const VentasScreen = ({ onNuevaVenta }) => {
  const stock = useStock();
  const [filtro, setFiltro] = React.useState("todas");
  const [drawer, setDrawer] = React.useState({ open: false, venta: null });

  const list = React.useMemo(() => {
    let out = stock.transacciones;
    if (filtro !== "todas") out = out.filter(t => t.estado === filtro);
    return [...out].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [stock.transacciones, filtro]);

  const counts = {
    todas:     stock.transacciones.length,
    ACTIVA:    stock.transacciones.filter(t => t.estado === "ACTIVA").length,
    ELIMINADA: stock.transacciones.filter(t => t.estado === "ELIMINADA").length,
  };

  return (
    <main className="page" data-screen-label="03 Ventas">
      <div className="page-head">
        <div>
          <div className="eyebrow">Transacciones</div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-sub">{counts.ACTIVA} activa{counts.ACTIVA === 1 ? "" : "s"} · {counts.ELIMINADA} eliminada{counts.ELIMINADA === 1 ? "" : "s"} en el historial.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 3v12M6 9l6 6 6-6M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={onNuevaVenta}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Nueva venta
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="seg">
          {[
            { id: "todas",     label: "Todas" },
            { id: "ACTIVA",    label: "Activas" },
            { id: "ELIMINADA", label: "Eliminadas" },
          ].map(opt => (
            <button key={opt.id} className={`seg-btn ${filtro === opt.id ? "is-active" : ""}`} onClick={() => setFiltro(opt.id)}>
              {opt.label}
              <span className="seg-count">{counts[opt.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th style={{ width: 160 }}>Fecha</th>
                <th>Observaciones</th>
                <th style={{ width: 70, textAlign: "right" }}>Items</th>
                <th style={{ width: 140, textAlign: "right" }}>Total</th>
                <th style={{ width: 140 }}>Usuario</th>
                <th style={{ width: 130 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan="7" className="empty-state">
                  <div className="empty-title">Sin ventas en este filtro</div>
                  <div className="empty-sub">Probá otro estado o creá una venta nueva.</div>
                </td></tr>
              )}
              {list.map(v => (
                <tr key={v.id} onClick={() => setDrawer({ open: true, venta: v })}>
                  <td className="td-id">#{v.id}</td>
                  <td className="td-muted">{fmtDateTime(v.fecha)}</td>
                  <td>
                    <div className="td-product-name">{v.observaciones || <em className="td-muted">Sin observaciones</em>}</div>
                  </td>
                  <td className="td-num">{v.detalles.length}</td>
                  <td className="td-num"><strong>{fmtARS(v.total)}</strong></td>
                  <td>
                    <div className="td-user">
                      <div className="avatar avatar-sm">{v.usuario.split(" ").map(s => s[0]).join("").slice(0, 2)}</div>
                      <span>{v.usuario}</span>
                    </div>
                  </td>
                  <td><EstadoChip estado={v.estado}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{list.length} ventas</span>
        </div>
      </div>

      <VentaDrawer
        open={drawer.open}
        venta={drawer.venta}
        onClose={() => setDrawer({ open: false, venta: null })}
      />
    </main>
  );
};

Object.assign(window, { VentasScreen, VentaDrawer, EstadoChip, fmtDateTime });
