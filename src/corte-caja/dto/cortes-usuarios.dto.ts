export class CreateCorteUsuarioDto {
    // 📌 Identificadores necesarios
    InicioCajaID: number;
    usuarioID: number;
  
    // 📌 Datos calculados automáticamente
    TotalIngresos: number;
    TotalIngresosEfectivo: number;
    TotalIngresosTarjeta: number;
    TotalIngresosTransferencia: number;
    TotalEgresos: number;
    TotalEgresosEfectivo: number;
    TotalEgresosTarjeta: number;
    TotalEgresosTransferencia: number;
    TotalEfectivo: number;
    TotalPagoConTarjeta: number;
    TotalTransferencia: number;
    SaldoEsperado: number;
  
    // 📌 Datos capturados por el usuario (opcionales en creación, obligatorios en actualización)
    SaldoReal?: number;
    TotalEfectivoCapturado?: number;
    TotalTarjetaCapturado?: number;
    TotalTransferenciaCapturado?: number;
    Diferencia?: number;
    Observaciones?: string;
    
    // 📌 Estatus del corte
    Estatus: 'Pendiente' | 'Cerrado' | 'Validado' | 'Cancelado';
  
    // 📌 Fechas
    FechaCorte?: Date;
    FechaActualizacion?: Date;
  }
  
  export class UpdateCorteUsuarioDto {
    // 📌 Solo se actualizan estos valores al cerrar el corte
    InicioCajaID: number;
    SaldoReal: number;
    TotalEfectivoCapturado: number;
    TotalTarjetaCapturado: number;
    TotalTransferenciaCapturado: number;
    Diferencia?: number;
    Observaciones?: string;
    Estatus: 'Pendiente' | 'Cerrado' | 'Validado' | 'Cancelado';
  
    // 📌 Fecha de actualización automática
    FechaActualizacion?: Date;
  }
  
  export class GenerateCorteUsuarioDto {
    TotalIngresos: number;
    TotalIngresosEfectivo: number;
    TotalIngresosTarjeta: number;
    TotalIngresosTransferencia: number;
    TotalEgresos: number;
    TotalEgresosEfectivo: number;
    TotalEgresosTarjeta: number;
    TotalEgresosTransferencia: number;
    TotalEfectivo: number;
    TotalPagoConTarjeta: number;
    TotalTransferencia: number;
    SaldoEsperado: number;
    SaldoReal: number;
    TotalEfectivoCapturado: number;
    TotalTarjetaCapturado: number;
    TotalTransferenciaCapturado: number;
    Diferencia: number;
    Observaciones?: string;
    Estatus: 'Pendiente' | 'Cerrado' | 'Validado' | 'Cancelado';

     // 🔹 **Nuevas propiedades para desglose**
  DetalleIngresos: {
    Monto: number;
    FormaPago: "Efectivo" | "Transferencia" | "Deposito" | "Tarjeta";
    Fecha: Date;
  }[];

  DetalleEgresos: {
    Monto: number;
    FormaPago: "Efectivo" | "Transferencia" | "Deposito" | "Tarjeta";
    Fecha: Date;
  }[];

  DetallePagosPoliza: {
    MontoPagado: number;
    MetodoPago: string;
    FechaPago: Date;
  }[];
  }
  