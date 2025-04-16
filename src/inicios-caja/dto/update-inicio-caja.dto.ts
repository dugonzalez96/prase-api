export class UpdateInicioCajaDto {
    UsuarioID?: number;
    UsuarioAutorizoID?: number;
    MontoInicial?: number;
    TotalEfectivo?: number;
    TotalTransferencia?: number;
    FirmaElectronica: string;
    Estatus?: 'Activo' | 'Cerrado' | 'Pendiente';
  }
  