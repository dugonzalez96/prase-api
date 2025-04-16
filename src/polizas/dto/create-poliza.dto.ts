export class CreatePolizaDto {
  CotizacionID?: number;
  NumeroPoliza?: string;
  FechaInicio?: Date;
  FechaFin?: Date;
  EstadoPoliza?: string;
  PrimaTotal?: number;
  TotalSinIVA?:number;
  DerechoPolizaAplicado:number;
  TotalPagos?: number;
  NumeroPagos?: number;
  DescuentoProntoPago?: number;
  TipoPagoID?: number;
  VersionActual?: number;
  TieneReclamos?: boolean;
  VehiculoID?: number;
  ClienteID?: number;
  NumOcupantes?: number;
  detalles?: CreateDetalleDto[];
}

export class CreateDetalleDto {
  CoberturaID: number;
  MontoSumaAsegurada: number;
  MontoDeducible: number;
  PrimaCalculada: number;
  PorcentajePrimaAplicado: number;
  ValorAseguradoUsado: number;
}