export class CreateTransaccionDto {
    InicioCajaID?: number;
    TipoTransaccion: 'Ingreso' | 'Egreso';
    FormaPago: 'Efectivo' | 'Transferencia' | 'Deposito' | 'Tarjeta';
    Monto: number;
    Validado?: boolean;
    UsuarioCreoID?: number;
    UsuarioValidoID?: number;
    CuentaBancariaID?: number;
    Descripcion?: string;
  }
  