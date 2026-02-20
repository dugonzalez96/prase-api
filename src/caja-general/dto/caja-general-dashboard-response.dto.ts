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
  saldoFinal: number; // Mantener por compatibilidad
  entrego: number; // Lo que realmente se entregó (= SaldoReal)
  diferencia: number; // entrego - saldoEsperado (negativo=faltante, positivo=sobrante)
  observaciones: string | null;
  usuarioCuadre: string | null;
  estatus: string; // 'Cerrado' | 'Pendiente' | 'Cancelado'
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
    // ⭐ NUEVO DESGLOSE POR FORMA DE PAGO
    efectivoEntregado: number;
    transferencias: number;
    tarjeta: number;
    depositos: number;
    diferencia: number;
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
    // ⭐ NUEVO: Prellenar totales por forma de pago
    totalEfectivoCapturado?: number;
    totalTarjetaCapturado?: number;
    totalTransferenciaCapturado?: number;
  };

  // Sección 7: Historial de cuadres
  historialCuadres: HistorialCuadreCajaGeneralDto[];
}
