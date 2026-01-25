// dto/cuadrar-caja-general.dto.ts
export class CuadrarCajaGeneralDto {
  fecha: string;
  sucursalId?: number;
  usuarioCuadreId: number;
  folioCierre?: string;

  // ════════════════════════════════════════════════════════════════
  // 💵 EFECTIVO FÍSICO - LO QUE SE ENTREGA
  // ════════════════════════════════════════════════════════════════

  /**
   * Total de efectivo físico que se entrega en el cuadre.
   * Este es el monto principal que se valida contra el SaldoEsperado.
   * Debe ser la suma del efectivo recibido de las cajas chicas.
   */
  totalEfectivoCapturado?: number;

  /**
   * Saldo real = totalEfectivoCapturado (deben coincidir).
   * Se mantiene por compatibilidad pero debe ser igual al efectivo.
   */
  saldoReal?: number;

  // ════════════════════════════════════════════════════════════════
  // ℹ️ INFORMATIVOS - NO SE ENTREGAN FÍSICAMENTE
  // ════════════════════════════════════════════════════════════════

  /**
   * Total de pagos con tarjeta del día (de todas las cajas chicas).
   * INFORMATIVO: Este dinero ya está en el banco, no se entrega físicamente.
   */
  totalTarjetaCapturado?: number;

  /**
   * Total de transferencias del día (de todas las cajas chicas).
   * INFORMATIVO: Este dinero ya está en el banco, no se entrega físicamente.
   */
  totalTransferenciaCapturado?: number;

  // ════════════════════════════════════════════════════════════════
  // OPCIONALES
  // ════════════════════════════════════════════════════════════════

  /**
   * Observaciones del cuadre.
   * OBLIGATORIO si existe diferencia entre efectivo esperado y capturado.
   */
  observaciones?: string;
}
