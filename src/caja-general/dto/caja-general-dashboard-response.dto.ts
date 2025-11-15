// src/caja-general/dto/caja-general-dashboard-response.dto.ts

export type EstadoCuadre = 'PRE_CUADRE' | 'CUADRADO' | 'CON_DIFERENCIA';

export interface MovimientoTimelineDto {
  hora: string; // ej. "17:35"
  tipo:
    | 'CORTE_CAJA_CHICA'
    | 'PAGO_POLIZA'
    | 'TRANSACCION_INGRESO'
    | 'TRANSACCION_EGRESO';
  sucursalId: number | null;
  nombreSucursal: string | null;
  referencia: string | null;
  descripcion: string | null;
  monto: number;
}

export interface CajaGeneralResumenDto {
  saldoInicial: number;
  totalEntradas: number;
  totalEgresos: number;
  saldoCalculado: number;
  estadoCuadre: EstadoCuadre;
}

export interface HistorialCuadreCajaGeneralDto {
  cajaGeneralId: number;
  fecha: Date;
  sucursalId: number | null;
  nombreSucursal: string | null;
  saldoInicial: number;
  totalEntradas: number;
  totalEgresos: number;
  saldoFinal: number;
  usuarioCuadre: string | null;
  estatus: string; // 'Cerrado' | 'Pendiente' | etc.
}

export interface CajaGeneralDashboardResponseDto {
  filtros: {
    fecha: string;
    sucursalId?: number;
  };

  resumen: CajaGeneralResumenDto;

  // Timelines planos (para secciones 2 y 3)
  entradas: MovimientoTimelineDto[];
  egresos: MovimientoTimelineDto[];

  // 🔹 Desglose que me pediste:
  entradasDetalle: {
    cortesCajaChica: MovimientoTimelineDto[];
    pagosPoliza: MovimientoTimelineDto[];
    transaccionesIngreso: MovimientoTimelineDto[];
  };

  egresosDetalle: {
    transaccionesEgreso: MovimientoTimelineDto[];
    // si luego agregas otros tipos de egreso, se añaden aquí
  };

  // Sección 4: Listado de cortes de usuario
  cortesUsuarios: {
    usuario: string;
    usuarioId: number | null;
    sucursalId: number | null;
    nombreSucursal: string | null;
    fechaHoraCorte: Date;
    montoCorte: number;
    estadoCajaChica: string;
    estadoCajaGeneral: string;
  }[];

  // Sección 5: Inicios de usuario
  iniciosUsuarios: {
    usuario: string;
    usuarioId: number | null;
    sucursalId: number | null;
    nombreSucursal: string | null;
    fechaInicio: Date;
    montoInicio: number;
    estado: string;
  }[];

  // Sección 6: Pre-cuadre
  preCuadre: {
    saldoInicial: number;
    totalEntradas: number;
    totalEgresos: number;
    saldoCalculado: number;
    diferencia: number; // SIEMPRE 0 en backend (lo calcula el front)
  };

  // Sección 7: Historial de cuadres
  historialCuadres: HistorialCuadreCajaGeneralDto[];
}
