export class UpdateCotizacionDto {
  UsuarioID?: number;
  PrimaTotal?: number;
  EstadoCotizacion?: 'REGISTRO' | 'EMITIDA' | 'ACEPTADA' | 'ACTIVA' | 'RECHAZADA';
  TipoPagoID?: number;
  PorcentajeDescuento?: number;
  DerechoPoliza?: number;
  TipoSumaAseguradaID?: number;
  SumaAsegurada?: number;
  PeriodoGracia?: number;
  PaqueteCoberturaID?: number;
  UsoVehiculo?: number;
  TipoVehiculo?: number;
  AMIS?: string;
  NombrePersona?: string;
  UnidadSalvamento?: boolean;
  VIN?: string;
  CP?: string;
  Marca?: string;
  Submarca?: string;
  Modelo?: string;
  Version?: string;
  Correo?:string;
  Telefono?:string;
  Placa?:string;
  NoMotor?:string;
  NumOcupantes?: number;
  UsuarioRegistro?:number;
    // Nuevas columnas
    CostoBase?: number;
    AjusteSiniestralidad?: number;
    AjusteCP?: number;
    AjusteTipoPago?: number;
    SubtotalSiniestralidad?: number;
    SubtotalTipoPago?: number;
    CostoNeto?: number;
    IVA?: number;
  detalles?: UpdateDetalleCotizacionDto[];
}

export class UpdateDetalleCotizacionDto {
  CoberturaID?: number;
  MontoSumaAsegurada?: number;
  DeducibleID?: number;
  MontoDeducible?: number;
  PrimaCalculada?: number;
  PorcentajePrimaAplicado?: number;
  ValorAseguradoUsado?: number;
  PolizaID?:number;
}
