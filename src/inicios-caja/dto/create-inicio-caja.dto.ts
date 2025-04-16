export class CreateInicioCajaDto {
    UsuarioID: number;
    UsuarioAutorizoID?: number;
    MontoInicial: number;
    TotalEfectivo: number;
    TotalTransferencia: number;
    FirmaElectronica?: string; // Firma electrónica del usuario autorizador
  }
  