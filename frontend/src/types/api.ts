export type Categoria = 'REPUESTO' | 'LUBRICANTE';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type EstadoVenta = 'PENDIENTE' | 'COMPLETADA' | 'ANULADA';
export type Rol = 'ADMIN' | 'OPERADOR';

export interface ProductoResponse {
  id: number;
  nombre: string;
  codigo: string;
  categoria: Categoria;
  descripcion?: string;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn?: string;
  valorInventario?: number;
}

export interface MovimientoResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  usuarioId: number;
  usuarioNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  nota?: string;
  stockAnterior: number;
  stockPosterior: number;
  fecha: string;
}

export interface ProductoMasVendidoResponse {
  nombre: string;
  cantidadVendida: number;
  ingresos: number;
}

export interface ReporteVentasResponse {
  periodo: { desde: string; hasta: string };
  totalVentas: number;
  cantidadTransacciones: number;
  productosMasVendidos: ProductoMasVendidoResponse[];
  ventasDiarias: number[];
  costoMercaderia: number;
  manoObra: number;
  margen: number;
}

export interface DetalleVentaResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
}

export interface VentaResponse {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  total: number;
  estado: EstadoVenta;
  observaciones?: string;
  fecha: string;
  medioPago: MedioPago;
  manoObra: number;
  clienteId?: number;
  clienteNombre?: string;
  vehiculoId?: number;
  vehiculoPatente?: string;
  vehiculoDescripcion?: string;
  kmVehiculo?: number;
  cantidadItems: number;
  margen: number;
  detalles: DetalleVentaResponse[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  usuario: AuthUser;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

export type MedioPago = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA';

export const MEDIOS_PAGO: { id: MedioPago; label: string }[] = [
  { id: 'EFECTIVO', label: 'Efectivo' },
  { id: 'DEBITO', label: 'Débito' },
  { id: 'CREDITO', label: 'Crédito' },
  { id: 'TRANSFERENCIA', label: 'Transferencia' },
];

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface ResumenResponse {
  desde: string;
  hasta: string;
  ventas: number;
  ventasAnterior: number;
  transacciones: number;
  transaccionesAnterior: number;
  margen: number;
  margenAnterior: number;
  ventasHoy: number;
  montoHoy: number;
  productosBajoStock: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
  ventasDiarias: number[];
  productosMasVendidos: ProductoMasVendidoResponse[];
}

export interface VehiculoResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  km?: number;
}

export interface ClienteResponse {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
  documento?: string;
  notas?: string;
  activo: boolean;
  creadoEn: string;
  vehiculos: VehiculoResponse[];
}

export interface ProveedorResponse {
  id: number;
  nombre: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export type EstadoCompra = 'PENDIENTE' | 'RECIBIDA' | 'ANULADA';

export interface CompraResponse {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  usuarioNombre: string;
  estado: EstadoCompra;
  comprobante?: string;
  observaciones?: string;
  total: number;
  fecha: string;
  recibidaEn?: string;
  detalles: { productoId: number; productoNombre: string; productoCodigo?: string; cantidad: number; costoUnitario: number; subtotal: number }[];
}

export interface SugerenciaCompra {
  productoId: number;
  nombre: string;
  codigo?: string;
  stockActual: number;
  stockMinimo: number;
  cantidadSugerida: number;
  costoUnitario: number;
}

export interface CierreResponse {
  id: number;
  fecha: string;
  usuarioNombre: string;
  cantidadVentas: number;
  totalEfectivo: number;
  totalDebito: number;
  totalCredito: number;
  totalTransferencia: number;
  efectivoContado: number;
  diferencia: number;
  observaciones?: string;
  creadoEn: string;
}

export interface CajaResponse {
  fecha: string;
  cantidadVentas: number;
  total: number;
  totalesPorMedio: Record<MedioPago, number>;
  cierre: CierreResponse | null;
}
