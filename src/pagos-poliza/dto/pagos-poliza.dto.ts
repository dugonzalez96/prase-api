export class CreatePagosPolizaDto {
  PolizaID: number;
  FechaPago: Date;
  MontoPagado: number;
  ReferenciaPago: string;
  NombreTitular: string;
  FechaMovimiento: Date;
  IDMetodoPago: number;
  IDEstatusPago: number;
  UsuarioID?: number;
  UsuarioValidoID?: number;
  CuentaBancariaID?: number;
  Validado?: boolean;
}
export class UpdatePagosPolizaDto extends CreatePagosPolizaDto {
  MotivoCancelacion?: string;
}
