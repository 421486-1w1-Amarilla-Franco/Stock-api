// =============================================================
// Pantalla Productos
// Tabla densa, filtros, sort, búsqueda, drawer create/edit
// =============================================================

const ProductoDrawer = ({ open, onClose, producto, onOpenMovimiento }) => {
  const { createProducto, updateProducto, toast } = useStock();
  const isEdit = !!producto;
  const empty = {
    nombre: "",
    codigo: "",
    categoria: "REPUESTO",
    descripcion: "",
    precioCosto: 0,
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 0,
  };
  const [form, setForm] = React.useState(empty);

  React.useEffect(() => {
    if (open) setForm(producto ? { ...producto } : empty);
  }, [open, producto]);

  const set = (k) => (e) => {
    const v = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const handleSave = () => {
    if (!form.nombre.trim()) {
      toast({ kind: "error", title: "El nombre es obligatorio" });
      return;
    }
    if (isEdit) {
      updateProducto(producto.id, form);
      toast({ kind: "success", title: `${form.nombre} actualizado` });
    } else {
      createProducto(form);
      toast({ kind: "success", title: `${form.nombre} creado`, description: `Stock inicial: ${form.stockActual}` });
    }
    onClose();
  };

  const margen = form.precioCosto > 0
    ? ((form.precioVenta - form.precioCosto) / form.precioCosto) * 100
    : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      subtitle={isEdit ? `#${producto?.id} · ${producto?.codigo}` : "Completá los datos. Podés ajustar después."}
      width={520}
      footer={
        <>
          {isEdit && onOpenMovimiento && (
            <button
              className="btn btn-ghost"
              onClick={() => { onClose(); onOpenMovimiento(producto.id, "AJUSTE"); }}
              style={{ marginRight: "auto" }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 12h16M9 6l-5 6 5 6M15 6l5 6-5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Ajustar stock
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="form-section">
          <div className="form-section-title">Datos básicos</div>
          <Field label="Nombre" required>
            <input className="input" value={form.nombre} onChange={set("nombre")} placeholder="Ej: Filtro de aceite Mann W712"/>
          </Field>
          <div className="form-row form-row-2">
            <Field label="Código">
              <input className="input mono" value={form.codigo} onChange={set("codigo")} placeholder="FLT-W712"/>
            </Field>
            <Field label="Categoría">
              <div className="seg seg-full">
                <button
                  type="button"
                  className={`seg-btn ${form.categoria === "REPUESTO" ? "is-active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, categoria: "REPUESTO" }))}
                >Repuesto</button>
                <button
                  type="button"
                  className={`seg-btn ${form.categoria === "LUBRICANTE" ? "is-active" : ""}`}
                  onClick={() => setForm(f => ({ ...f, categoria: "LUBRICANTE" }))}
                >Lubricante</button>
              </div>
            </Field>
          </div>
          <Field label="Descripción">
            <textarea className="input" rows="2" value={form.descripcion} onChange={set("descripcion")} placeholder="Notas, compatibilidades, marca…"/>
          </Field>
        </div>

        <div className="form-section">
          <div className="form-section-title">Precios</div>
          <div className="form-row form-row-2">
            <Field label="Precio de costo" prefix="$">
              <input className="input" type="number" min="0" value={form.precioCosto} onChange={set("precioCosto")}/>
            </Field>
            <Field label="Precio de venta" prefix="$">
              <input className="input" type="number" min="0" value={form.precioVenta} onChange={set("precioVenta")}/>
            </Field>
          </div>
          {margen != null && (
            <div className="margin-pill">
              <span>Margen</span>
              <strong className={margen < 20 ? "is-low" : "is-ok"}>{margen.toFixed(1)}%</strong>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-section-title">Stock</div>
          <div className="form-row form-row-2">
            <Field label="Stock actual">
              <input className="input" type="number" min="0" value={form.stockActual} onChange={set("stockActual")}/>
            </Field>
            <Field label="Stock mínimo">
              <input className="input" type="number" min="0" value={form.stockMinimo} onChange={set("stockMinimo")}/>
            </Field>
          </div>
          {form.stockActual <= form.stockMinimo && (
            <div className="hint hint-warn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 9v4M12 17v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg>
              Este producto quedará marcado como bajo stock.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

const Field = ({ label, required, prefix, children }) => (
  <label className="field">
    <span className="field-label">
      {label}{required && <span className="field-req">*</span>}
    </span>
    <div className={`field-control ${prefix ? "has-prefix" : ""}`}>
      {prefix && <span className="field-prefix">{prefix}</span>}
      {children}
    </div>
  </label>
);

const StockBadge = ({ producto }) => {
  if (!producto.activo) return <span className="status-chip status-inactive">Inactivo</span>;
  if (producto.stockActual === 0) return <span className="status-chip status-out">Sin stock</span>;
  if (producto.stockActual <= producto.stockMinimo * 0.34) return <span className="status-chip status-critical">Crítico</span>;
  if (producto.stockActual <= producto.stockMinimo) return <span className="status-chip status-low">Bajo</span>;
  return <span className="status-chip status-ok">OK</span>;
};

const ProductosScreen = ({ onOpenMovimiento }) => {
  const stock = useStock();
  const [q, setQ] = React.useState("");
  const [categoria, setCategoria] = React.useState("todas");
  const [filtro, setFiltro] = React.useState("activos"); // activos | bajo-stock | inactivos
  const [sortBy, setSortBy] = React.useState({ key: "nombre", dir: "asc" });
  const [drawer, setDrawer] = React.useState({ open: false, producto: null });
  const [confirm, setConfirm] = React.useState({ open: false, producto: null });

  const list = React.useMemo(() => {
    let out = stock.productos;
    if (filtro === "activos") out = out.filter(p => p.activo);
    else if (filtro === "inactivos") out = out.filter(p => !p.activo);
    else if (filtro === "bajo-stock") out = out.filter(p => p.activo && p.stockActual <= p.stockMinimo);
    if (categoria !== "todas") out = out.filter(p => p.categoria === categoria);
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(p =>
        p.nombre.toLowerCase().includes(qq) ||
        (p.codigo || "").toLowerCase().includes(qq) ||
        (p.descripcion || "").toLowerCase().includes(qq)
      );
    }
    out = [...out].sort((a, b) => {
      const k = sortBy.key;
      const sign = sortBy.dir === "asc" ? 1 : -1;
      if (typeof a[k] === "string") return a[k].localeCompare(b[k]) * sign;
      return ((a[k] ?? 0) - (b[k] ?? 0)) * sign;
    });
    return out;
  }, [stock.productos, q, categoria, filtro, sortBy]);

  const toggleSort = (key) => {
    setSortBy(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  const countAll = stock.productos.filter(p => p.activo).length;
  const countBajo = stock.productos.filter(p => p.activo && p.stockActual <= p.stockMinimo).length;
  const countInact = stock.productos.filter(p => !p.activo).length;

  return (
    <main className="page" data-screen-label="02 Productos">
      <div className="page-head">
        <div>
          <div className="eyebrow">Catálogo</div>
          <h1 className="page-title">Productos</h1>
          <p className="page-sub">{countAll} activos · {countBajo} bajo stock · {countInact} inactivos.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 3v12M6 9l6 6 6-6M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => setDrawer({ open: true, producto: null })}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, código o descripción…"/>
        </div>
        <div className="seg">
          <button className={`seg-btn ${filtro === "activos" ? "is-active" : ""}`} onClick={() => setFiltro("activos")}>
            Activos <span className="seg-count">{countAll}</span>
          </button>
          <button className={`seg-btn ${filtro === "bajo-stock" ? "is-active" : ""}`} onClick={() => setFiltro("bajo-stock")}>
            Bajo stock <span className="seg-count seg-count-warn">{countBajo}</span>
          </button>
          <button className={`seg-btn ${filtro === "inactivos" ? "is-active" : ""}`} onClick={() => setFiltro("inactivos")}>
            Inactivos <span className="seg-count">{countInact}</span>
          </button>
        </div>
        <div className="seg">
          {[
            { id: "todas", label: "Todas" },
            { id: "REPUESTO", label: "Repuestos" },
            { id: "LUBRICANTE", label: "Lubricantes" },
          ].map(opt => (
            <button key={opt.id} className={`seg-btn ${categoria === opt.id ? "is-active" : ""}`} onClick={() => setCategoria(opt.id)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <SortableTh label="Producto" k="nombre" sortBy={sortBy} onSort={toggleSort}/>
                <SortableTh label="Categoría" k="categoria" sortBy={sortBy} onSort={toggleSort} style={{ width: 130 }}/>
                <SortableTh label="P. costo" k="precioCosto" sortBy={sortBy} onSort={toggleSort} style={{ width: 120, textAlign: "right" }}/>
                <SortableTh label="P. venta" k="precioVenta" sortBy={sortBy} onSort={toggleSort} style={{ width: 130, textAlign: "right" }}/>
                <SortableTh label="Stock" k="stockActual" sortBy={sortBy} onSort={toggleSort} style={{ width: 130, textAlign: "right" }}/>
                <th style={{ width: 110 }}>Estado</th>
                <th style={{ width: 60 }} aria-label="acciones"/>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan="7" className="empty-state">
                  <div className="empty-title">Nada por acá</div>
                  <div className="empty-sub">Ajustá los filtros o creá un producto nuevo.</div>
                </td></tr>
              )}
              {list.map(p => {
                const margen = p.precioCosto > 0 ? ((p.precioVenta - p.precioCosto) / p.precioCosto) * 100 : 0;
                return (
                  <tr key={p.id} onClick={() => setDrawer({ open: true, producto: p })}>
                    <td>
                      <div className="td-product">
                        <span className="td-product-name">{p.nombre}</span>
                        <span className="td-product-code">{p.codigo}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${p.categoria === "LUBRICANTE" ? "chip-lub" : "chip-rep"}`}>
                        {p.categoria === "LUBRICANTE" ? "Lubricante" : "Repuesto"}
                      </span>
                    </td>
                    <td className="td-num td-muted">{fmtARS(p.precioCosto)}</td>
                    <td className="td-num">
                      <div className="price-cell">
                        <strong>{fmtARS(p.precioVenta)}</strong>
                        {margen > 0 && <span className="price-margin">{margen.toFixed(0)}%</span>}
                      </div>
                    </td>
                    <td className="td-num">
                      <div className="stock-cell">
                        <strong>{p.stockActual}</strong>
                        <span className="stock-min">/ {p.stockMinimo} mín</span>
                      </div>
                    </td>
                    <td><StockBadge producto={p}/></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="row-action-group">
                        {p.activo ? (
                          <button
                            className="row-action"
                            onClick={() => setConfirm({ open: true, producto: p })}
                            aria-label="Dar de baja"
                            title="Dar de baja"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        ) : (
                          <button
                            className="row-action row-action-success"
                            onClick={() => stock.restoreProducto(p.id)}
                            aria-label="Reactivar"
                            title="Reactivar"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 12a8 8 0 1 1 3.5 6.6M4 20v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-foot">
          <span>{list.length} de {stock.productos.length} productos</span>
        </div>
      </div>

      <ProductoDrawer
        open={drawer.open}
        producto={drawer.producto}
        onClose={() => setDrawer({ open: false, producto: null })}
        onOpenMovimiento={onOpenMovimiento}
      />

      <ConfirmModal
        open={confirm.open}
        title="Dar de baja producto"
        description={`"${confirm.producto?.nombre}" quedará marcado como inactivo. Podés reactivarlo después.`}
        confirmLabel="Dar de baja"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setConfirm({ open: false, producto: null })}
        onConfirm={() => {
          stock.deleteProducto(confirm.producto.id);
          stock.toast({ kind: "info", title: `${confirm.producto.nombre} dado de baja` });
          setConfirm({ open: false, producto: null });
        }}
      />
    </main>
  );
};

const SortableTh = ({ label, k, sortBy, onSort, style }) => {
  const active = sortBy.key === k;
  return (
    <th style={style} className="sortable-th" onClick={() => onSort(k)}>
      <span>{label}</span>
      <svg viewBox="0 0 12 12" width="10" height="10" fill="none" className={`sort-icon ${active ? "is-active" : ""}`}>
        {active && sortBy.dir === "desc"
          ? <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
      </svg>
    </th>
  );
};

Object.assign(window, { ProductosScreen, ProductoDrawer, Field, StockBadge });
