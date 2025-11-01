// src/caja-chica/dto/create-caja-chica.dto.ts
export class CreateCajaChicaDto {
  // Capturables
  SaldoReal: number;
  TotalEfectivoCapturado: number;
  TotalTarjetaCapturado: number;
  TotalTransferenciaCapturado: number;

  // Opcional
  Observaciones?: string | null;
  FolioCierre?: string | null;
}
