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
}

export interface DetalleVentaResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  cantidad: number;
  precioUnitario: number;
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
