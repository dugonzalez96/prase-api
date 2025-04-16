
import { Cotizacion } from "src/cotizaciones/entities/cotizacion.entity";

export class UpdatePolizaDto {
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
  detalles?: UpdateDetalleDto[];
}

export class UpdateDetalleDto {
  DetalleID: number;  // Se agrega el DetalleID para identificar cada detalle
  cotizacion?: Cotizacion; // Se añade como opcional
  PolizaID?: number; // Se añade como opcional
  CoberturaID?: number; // Hacer opcional para compatibilidad
  MontoSumaAsegurada?: number; // Hacer opcional para compatibilidad
  MontoDeducible?: number; // Hacer opcional para compatibilidad
  PrimaCalculada?: number; // Hacer opcional para compatibilidad
  PorcentajePrimaAplicado?: number; // Hacer opcional para compatibilidad
  ValorAseguradoUsado?: number; // Hacer opcional para compatibilidad
  EsPoliza?: boolean; // Se añade como opcional
}
