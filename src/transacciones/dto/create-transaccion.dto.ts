export class CreateTransaccionDto {
    InicioCajaID?: number;
    TipoTransaccion: 'Ingreso' | 'Egreso';
    EsGeneral?: boolean;
    FormaPago: 'Efectivo' | 'Transferencia' | 'Deposito' | 'Tarjeta';
    Monto: number;
    Validado?: boolean;
    UsuarioCreoID?: number;
    UsuarioValidoID?: number;
    CuentaBancariaID?: number;
    Descripcion?: string;
  }
  