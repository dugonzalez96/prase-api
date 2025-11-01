// src/caja-chica/dto/precuadre-caja-chica.dto.ts
export class PrecuadreCajaChicaDto {
  // Totales calculados (solo lectura)
  TotalIngresos: number;
  TotalEgresos: number;
  TotalEfectivo: number;
  TotalPagoConTarjeta: number;
  TotalTransferencia: number;

  // Esperado (solo lectura)
  SaldoEsperado: number;

  // Capturables por el usuario (para el POST)
  SaldoReal: number;                      // lo que cuentan realmente
  TotalEfectivoCapturado: number;
  TotalTarjetaCapturado: number;
  TotalTransferenciaCapturado: number;

  // Derivado (solo lectura si deseas mostrarlo en UI)
  Diferencia: number;                     // SaldoReal - SaldoEsperado

  // Auxiliares de vista
  Fecha: Date;
  PendientesDeCorte: number;
  UsuariosPendientes?: Array<{ UsuarioID: number; Nombre?: string }>;
}
