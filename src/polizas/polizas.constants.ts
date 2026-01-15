// ===============================================================
// ARCHIVO INTERNO - NO EXPONER EN CONTROLADORES
// Constantes para manejo de estados de pólizas
// ===============================================================

/**
 * Estados posibles de una póliza
 */
export const ESTADOS_POLIZA = {
  PAGO_INMEDIATO: 'PAGO INMEDIATO',
  PERIODO_GRACIA: 'PERIODO DE GRACIA',
  ACTIVA: 'ACTIVA',
  PENDIENTE: 'PENDIENTE',
  CANCELADA: 'CANCELADA',
} as const;

/**
 * Estados que indican que la póliza está vigente (puede operar)
 * Usar para validaciones de CONSULTA (GET)
 */
export const ESTADOS_VIGENTES = [
  ESTADOS_POLIZA.PAGO_INMEDIATO,
  ESTADOS_POLIZA.PERIODO_GRACIA,
  ESTADOS_POLIZA.ACTIVA,
] as const;

/**
 * Estados que permiten modificaciones a la póliza
 * Usar para validaciones de ESCRITURA (POST, PUT, PATCH)
 */
export const ESTADOS_MODIFICABLES = [
  ESTADOS_POLIZA.ACTIVA,
] as const;

/**
 * Estados que requieren completar el primer pago para activarse
 */
export const ESTADOS_REQUIEREN_PRIMER_PAGO = [
  ESTADOS_POLIZA.PAGO_INMEDIATO,
  ESTADOS_POLIZA.PERIODO_GRACIA,
] as const;

/**
 * Estados válidos para actualización manual vía API
 */
export const ESTADOS_VALIDOS_UPDATE = [
  ESTADOS_POLIZA.ACTIVA,
  ESTADOS_POLIZA.PENDIENTE,
  ESTADOS_POLIZA.PERIODO_GRACIA,
  ESTADOS_POLIZA.PAGO_INMEDIATO,
] as const;

// Tipo derivado para TypeScript
export type EstadoPoliza = typeof ESTADOS_POLIZA[keyof typeof ESTADOS_POLIZA];
