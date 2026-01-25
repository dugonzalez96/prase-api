export class CreateCajaChicaDto {
  // ════════════════════════════════════════════════════════════════
  // 💵 EFECTIVO FÍSICO - LO QUE SE ENTREGA
  // ════════════════════════════════════════════════════════════════

  /**
   * Total de efectivo físico que se entrega en el cuadre.
   * Este es el monto principal que se valida contra el SaldoEsperado.
   */
  TotalEfectivoCapturado: number;

  /**
   * Saldo real = TotalEfectivoCapturado (deben coincidir).
   * Se mantiene por compatibilidad pero debe ser igual al efectivo.
   */
  SaldoReal: number;

  // ════════════════════════════════════════════════════════════════
  // ℹ️ INFORMATIVOS - NO SE ENTREGAN FÍSICAMENTE
  // ════════════════════════════════════════════════════════════════

  /**
   * Total de pagos con tarjeta del día.
   * INFORMATIVO: Este dinero ya está en el banco, no se entrega físicamente.
   */
  TotalTarjetaCapturado?: number;

  /**
   * Total de transferencias del día.
   * INFORMATIVO: Este dinero ya está en el banco, no se entrega físicamente.
   */
  TotalTransferenciaCapturado?: number;

  // ════════════════════════════════════════════════════════════════
  // OPCIONALES
  // ════════════════════════════════════════════════════════════════

  /**
   * Observaciones del cuadre.
   * OBLIGATORIO si existe diferencia entre efectivo esperado y capturado.
   */
  Observaciones?: string | null;

  FolioCierre?: string | null;
  SucursalID?: number | null;
}
