export class CreateCajaChicaDto {
  // Capturables
  SaldoReal: number;
  TotalEfectivoCapturado: number;
  TotalTarjetaCapturado: number;
  TotalTransferenciaCapturado: number;

  // Opcional
  Observaciones?: string | null;
  FolioCierre?: string | null;

  // Nueva opción: indicar explícitamente la sucursal si se desea
  SucursalID?: number | null;

}
