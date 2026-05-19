import { useState, useMemo, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { exportCSV } from '../lib/export';
import { useUsuarios, useCrearUsuario, useActualizarUsuario, useEliminarUsuario } from '../hooks/useUsuarios';
import type { UsuarioResponse, AuthUser } from '../types/api';
import { fmtDateTime } from '../lib/format';
import { initials } from '../lib/format';
import Drawer from '../components/Drawer';
import ConfirmModal from '../components/ConfirmModal';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';
type FiltroRol = 'todos' | 'ADMIN' | 'OPERADOR';

function RolChip({ rol }: { rol: string }) {
  return (
    <span className={`chip ${rol === 'ADMIN' ? 'chip-admin' : 'chip-rep'}`}>
      {rol === 'ADMIN' ? 'Admin' : 'Operador'}
    </span>
  );
}

function EstadoChip({ activo }: { activo: boolean }) {
  return (
    <span className={`estado-chip ${activo ? 'estado-done' : 'estado-cancel'}`}>
      <span className="estado-dot" />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

interface UsuarioForm {
  nombre: string;
  email: string;
  password: string;
  rol: 'ADMIN' | 'OPERADOR';
}

const EMPTY_FORM: UsuarioForm = { nombre: '', email: '', password: '', rol: 'OPERADOR' };

function UsuarioDrawer({
  open, onClose, usuario, currentUserEmail, onSuccess, onError,
}: {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioResponse | null;
  currentUserEmail?: string;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  const isEdit = !!usuario;
  const [form, setForm] = useState<UsuarioForm>({ ...EMPTY_FORM });
  const [touched, setTouched] = useState(false);
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();

  useEffect(() => {
    if (!open) { setTouched(false); return; }
    setForm(usuario
      ? { nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol }
      : { ...EMPTY_FORM }
    );
  }, [open, usuario]);

  const isPending = crear.isPending || actualizar.isPending;

  const isValid =
    form.nombre.trim() &&
    form.email.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    (!isEdit ? form.password.length >= 6 : true);

  const handleSave = () => {
    setTouched(true);
    if (!isValid) return;
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      rol: form.rol,
      ...(form.password ? { password: form.password } : {}),
    };
    if (isEdit && usuario) {
      actualizar.mutate({ id: usuario.id, ...payload }, {
        onSuccess: () => { onSuccess?.(`${form.nombre} actualizado`); onClose(); },
        onError: (err: unknown) => onError?.((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al actualizar'),
      });
    } else {
      crear.mutate(payload as typeof payload & { password: string }, {
        onSuccess: () => { onSuccess?.(`Usuario ${form.nombre} creado`); onClose(); },
        onError: (err: unknown) => onError?.((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al crear usuario'),
      });
    }
  };

  const isSelf = isEdit && usuario?.email === currentUserEmail;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      subtitle={isEdit ? `#${usuario?.id} · ${usuario?.email}` : 'Completá los datos del nuevo usuario.'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isPending || (touched && !isValid)}
          >
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <div className="form">
        <div className="form-section">
          <div className="form-section-title">Datos personales</div>
          <label className="field">
            <span className="field-label">Nombre <span className="field-req">*</span></span>
            <div className="field-control">
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Juan García"
              />
            </div>
            {touched && !form.nombre.trim() && (
              <span className="field-error">El nombre es obligatorio</span>
            )}
          </label>
          <label className="field">
            <span className="field-label">Email <span className="field-req">*</span></span>
            <div className="field-control">
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            {touched && form.email && !/\S+@\S+\.\S+/.test(form.email) && (
              <span className="field-error">Email inválido</span>
            )}
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">Contraseña</div>
          <label className="field">
            <span className="field-label">
              {isEdit ? 'Nueva contraseña' : 'Contraseña'}
              {!isEdit && <span className="field-req"> *</span>}
            </span>
            <div className="field-control">
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                autoComplete="new-password"
              />
            </div>
            {touched && !isEdit && form.password.length > 0 && form.password.length < 6 && (
              <span className="field-error">Mínimo 6 caracteres</span>
            )}
            {touched && !isEdit && !form.password && (
              <span className="field-error">La contraseña es obligatoria</span>
            )}
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-title">Rol</div>
          <label className="field">
            <span className="field-label">Rol del usuario</span>
            <div className="field-control">
              <div className="seg seg-full">
                <button
                  type="button"
                  className={`seg-btn${form.rol === 'OPERADOR' ? ' is-active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, rol: 'OPERADOR' }))}
                  disabled={isSelf}
                >
                  Operador
                </button>
                <button
                  type="button"
                  className={`seg-btn${form.rol === 'ADMIN' ? ' is-active' : ''}`}
                  onClick={() => setForm((f) => ({ ...f, rol: 'ADMIN' }))}
                  disabled={isSelf}
                >
                  Admin
                </button>
              </div>
            </div>
            {isSelf && (
              <span className="field-hint">No podés cambiar el rol de tu propia cuenta.</span>
            )}
          </label>
          {form.rol === 'ADMIN' && (
            <div className="hint hint-info">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 8v4M12 16v.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
              </svg>
              Los admins pueden gestionar usuarios, eliminar ventas y dar de baja productos.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default function Usuarios({
  user, onSuccess, onInfo, onError,
}: {
  user?: AuthUser | null;
  onSuccess?: (msg: string) => void;
  onInfo?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  const { data: usuarios = [], isLoading, isError, refetch } = useUsuarios();
  const eliminar = useEliminarUsuario();

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('activos');
  const [filtroRol, setFiltroRol] = useState<FiltroRol>('todos');
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState<{ open: boolean; usuario: UsuarioResponse | null }>({ open: false, usuario: null });
  const [confirm, setConfirm] = useState<{ open: boolean; usuario: UsuarioResponse | null }>({ open: false, usuario: null });

  const list = useMemo(() => {
    let out = [...usuarios];
    if (filtroEstado === 'activos') out = out.filter((u) => u.activo);
    else if (filtroEstado === 'inactivos') out = out.filter((u) => !u.activo);
    if (filtroRol !== 'todos') out = out.filter((u) => u.rol === filtroRol);
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter((u) =>
        u.nombre.toLowerCase().includes(qq) ||
        u.email.toLowerCase().includes(qq)
      );
    }
    return out.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [usuarios, filtroEstado, filtroRol, q]);

  const counts = useMemo(() => ({
    todos: usuarios.length,
    activos: usuarios.filter((u) => u.activo).length,
    inactivos: usuarios.filter((u) => !u.activo).length,
    admins: usuarios.filter((u) => u.rol === 'ADMIN').length,
    operadores: usuarios.filter((u) => u.rol === 'OPERADOR').length,
  }), [usuarios]);

  const handleBaja = () => {
    if (!confirm.usuario) return;
    const nombre = confirm.usuario.nombre;
    const id = confirm.usuario.id;
    setConfirm({ open: false, usuario: null });
    eliminar.mutate(id, {
      onSuccess: () => onInfo?.(`${nombre} dado de baja`),
      onError: (err: unknown) => onError?.((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje ?? 'Error al dar de baja'),
    });
  };

  return (
    <main className="page" style={{ paddingTop: 80 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Administración</div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-sub">
            {counts.activos} activo{counts.activos === 1 ? '' : 's'} · {counts.admins} admin{counts.admins === 1 ? '' : 's'} · {counts.operadores} operador{counts.operadores === 1 ? '' : 'es'}.
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-ghost"
            onClick={() => exportCSV('usuarios', list.map((u) => ({
              nombre: u.nombre,
              email: u.email,
              rol: u.rol,
              estado: u.activo ? 'Activo' : 'Inactivo',
              creadoEn: fmtDateTime(u.creadoEn),
            })), [
              { key: 'nombre', header: 'Nombre' },
              { key: 'email', header: 'Email' },
              { key: 'rol', header: 'Rol' },
              { key: 'estado', header: 'Estado' },
              { key: 'creadoEn', header: 'Creado' },
            ])}
          >
            <Download size={14} strokeWidth={1.8} />
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => setDrawer({ open: true, usuario: null })}>
            <Plus size={14} strokeWidth={2} />
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="filterbar">
        <div className="filter-search">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o email…" />
        </div>
        <div className="seg">
          {([
            { id: 'activos', label: 'Activos', count: counts.activos },
            { id: 'inactivos', label: 'Inactivos', count: counts.inactivos },
            { id: 'todos', label: 'Todos', count: counts.todos },
          ] as { id: FiltroEstado; label: string; count: number }[]).map((f) => (
            <button
              key={f.id}
              className={`seg-btn${filtroEstado === f.id ? ' is-active' : ''}`}
              onClick={() => setFiltroEstado(f.id)}
            >
              {f.label} <span className="seg-count">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="seg">
          {([
            { id: 'todos', label: 'Todos los roles' },
            { id: 'ADMIN', label: 'Admin' },
            { id: 'OPERADOR', label: 'Operador' },
          ] as { id: FiltroRol; label: string }[]).map((f) => (
            <button
              key={f.id}
              className={`seg-btn${filtroRol === f.id ? ' is-active' : ''}`}
              onClick={() => setFiltroRol(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card no-pad">
        <div className="table-wrap">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col" style={{ width: 120 }}>Rol</th>
                <th scope="col" style={{ width: 120 }}>Estado</th>
                <th scope="col" style={{ width: 160 }}>Creado</th>
                <th scope="col" style={{ width: 60 }} aria-label="acciones" />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 14, width: '60%' }} />
                        <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 4 }} />
                      </div>
                    </div>
                  </td>
                  <td><div className="skeleton" style={{ height: 20, width: 70 }} /></td>
                  <td><div className="skeleton" style={{ height: 20, width: 70 }} /></td>
                  <td><div className="skeleton" style={{ height: 14, width: 120 }} /></td>
                  <td />
                </tr>
              ))}
              {isError && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-title" style={{ color: 'var(--danger)' }}>Error al cargar usuarios</div>
                    <div className="empty-sub">No se pudo conectar con el servidor.</div>
                    <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => refetch()}>Reintentar</button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="empty-title">Sin usuarios en este filtro</div>
                    <div className="empty-sub">Probá otro filtro o creá un usuario nuevo.</div>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && list.map((u) => {
                const isSelf = u.email === user?.email;
                return (
                  <tr
                    key={u.id}
                    onClick={() => setDrawer({ open: true, usuario: u })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDrawer({ open: true, usuario: u });
                      }
                    }}
                  >
                    <td>
                      <div className="td-user">
                        <div className="avatar">{initials(u.nombre)}</div>
                        <div>
                          <div className="td-product-name">{u.nombre}</div>
                          <div className="td-product-code">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RolChip rol={u.rol} /></td>
                    <td><EstadoChip activo={u.activo} /></td>
                    <td className="td-muted" style={{ fontSize: 13 }}>{fmtDateTime(u.creadoEn)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {u.activo && !isSelf && (
                        <div className="row-action-group">
                          <button
                            className="row-action"
                            aria-label="Dar de baja"
                            title="Dar de baja"
                            onClick={() => setConfirm({ open: true, usuario: u })}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && (
          <div className="table-foot">
            <span>{list.length} usuario{list.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      <UsuarioDrawer
        open={drawer.open}
        usuario={drawer.usuario}
        onClose={() => setDrawer({ open: false, usuario: null })}
        currentUserEmail={user?.email}
        onSuccess={onSuccess}
        onError={onError}
      />

      <ConfirmModal
        open={confirm.open}
        title={`Dar de baja a ${confirm.usuario?.nombre ?? ''}`}
        description="El usuario no podrá iniciar sesión. Queda registro en el historial."
        confirmLabel="Dar de baja"
        cancelLabel="Cancelar"
        danger
        onConfirm={handleBaja}
        onCancel={() => setConfirm({ open: false, usuario: null })}
      />
    </main>
  );
}
