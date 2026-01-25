// src/caja-chica/dto/precuadre-caja-chica.dto.ts
export class PrecuadreCajaChicaDto {
  // ════════════════════════════════════════════════════════════════
  // TOTALES CALCULADOS DESDE CORTES (SOLO LECTURA)
  // ════════════════════════════════════════════════════════════════

  TotalIngresos: number;
  TotalEgresos: number;

  /**
   * 💵 Total de efectivo de los cortes del día.
   * Este es el monto que se debe entregar FÍSICAMENTE.
   */
  TotalEfectivo: number;

  /**
   * ℹ️ Total de tarjeta (INFORMATIVO - ya está en el banco)
   */
  TotalPagoConTarjeta: number;

  /**
   * ℹ️ Total de transferencia (INFORMATIVO - ya está en el banco)
   */
  TotalTransferencia: number;

  // ════════════════════════════════════════════════════════════════
  // SALDO ESPERADO (SOLO EFECTIVO)
  // ════════════════════════════════════════════════════════════════

  /**
   * 💵 Saldo esperado = SOLO EFECTIVO
   * Este es el monto físico que se espera recibir.
   * Tarjeta y transferencia NO se incluyen porque ya están en el banco.
   */
  SaldoEsperado: number;

  // ════════════════════════════════════════════════════════════════
  // CAPTURABLES POR EL USUARIO (PARA EL POST)
  // ════════════════════════════════════════════════════════════════

  /**
   * 💵 Efectivo físico contado - ESTE ES EL QUE SE VALIDA
   */
  TotalEfectivoCapturado: number;

  /**
   * SaldoReal = TotalEfectivoCapturado (deben ser iguales)
   */
  SaldoReal: number;

  /**
   * ℹ️ Tarjeta (INFORMATIVO)
   */
  TotalTarjetaCapturado: number;

  /**
   * ℹ️ Transferencia (INFORMATIVO)
   */
  TotalTransferenciaCapturado: number;

  // ════════════════════════════════════════════════════════════════
  // DIFERENCIA (SOLO EFECTIVO)
  // ════════════════════════════════════════════════════════════════

  /**
   * 💵 Diferencia = TotalEfectivoCapturado - SaldoEsperado
   * SOLO compara efectivo vs efectivo esperado.
   */
  Diferencia: number;

  // ════════════════════════════════════════════════════════════════
  // AUXILIARES DE VISTA
  // ════════════════════════════════════════════════════════════════

  Fecha: Date;
  PendientesDeCorte: number;
  UsuariosPendientes?: Array<{ UsuarioID: number; Nombre?: string }>;
}
