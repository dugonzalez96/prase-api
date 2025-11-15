// src/caja-general/dto/create-movimiento-caja-general.dto.ts
export class CreateMovimientoCajaGeneralDto {
  tipoTransaccion: 'Ingreso' | 'Egreso';
  formaPago: 'Efectivo' | 'Transferencia' | 'Deposito' | 'Tarjeta';
  monto: number;
  descripcion?: string;
  usuarioCreoId: number;
  cuentaBancariaId?: number;
  fechaTransaccion?: string; // opcional, si no se envía se usa NOW()
}

// src/caja-general/dto/get-movimientos-caja-general.dto.ts
export class GetMovimientosCajaGeneralDto {
  fecha?: string; // yyyy-MM-dd, si no se manda, puedes tomar hoy
  tipo?: 'Ingreso' | 'Egreso';
}
