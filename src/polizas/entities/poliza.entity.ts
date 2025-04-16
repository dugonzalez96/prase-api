import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Cotizacion } from 'src/cotizaciones/entities/cotizacion.entity';
import { TipoPago } from 'src/tipos-pago/tipo-pago.entity';
import { DetallesCotizacionPoliza } from 'src/cotizaciones/entities/detalle-cotizacion-poliza.entity';
import { PolizaHistorial } from './poliza-historial.entity';
import { Clientes } from 'src/clientes/clientes.entity';
import { Vehiculos } from 'src/vehiculos/vehiculos.entity';

@Entity('Polizas')
export class Poliza {
  @PrimaryGeneratedColumn()
  PolizaID: number;

  @ManyToOne(() => Cotizacion, { nullable: true })
  @JoinColumn({ name: 'CotizacionID' })
  cotizacion: Cotizacion;

  @Column({ length: 255, nullable: true })
  NumeroPoliza: string;

  @Column('date', { nullable: true })
  FechaInicio: Date;

  @Column('date', { nullable: true })
  FechaFin: Date;

  @Column({
    type: 'enum',
    enum: ['PERIODO DE GRACIA', 'ACTIVA','CANCELADA','PENDIENTE'],
    nullable: true,
    default: 'ACTIVA',
  })
  EstadoPoliza: 'PERIODO DE GRACIA' | 'ACTIVA' | 'CANCELADA' | 'PENDIENTE';

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  PrimaTotal: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  TotalSinIVA: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  DerechoPolizaAplicado: number;

  @Column('int', { nullable: true }) //PAGOS ACTUALES
  NumeroPagos: number;

  @Column('int', { nullable: true }) //PAGOS ACTUALES
  TotalPagos: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  DescuentoProntoPago: number;

  @ManyToOne(() => TipoPago, { nullable: true })
  @JoinColumn({ name: 'TipoPagoID' })
  tipoPago: TipoPago;

  @Column('int', { nullable: true })
  VersionActual: number;

  @Column('int', { nullable: true })
  NumOcupantes: number;

  @Column('boolean', { default: false })
  TieneReclamos: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  FechayHora: Date;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  FechaEmision: Date;

  @ManyToOne(() => Vehiculos, { nullable: true })
  @JoinColumn({ name: 'VehiculoID' })
  vehiculo: Vehiculos;

  @ManyToOne(() => Clientes, { nullable: true })
  @JoinColumn({ name: 'ClienteID' })
  cliente: Clientes;

  @OneToMany(() => DetallesCotizacionPoliza, (detalle) => detalle.poliza, { cascade: true })
  detalles: DetallesCotizacionPoliza[];  

  @OneToMany(() => PolizaHistorial, (historial) => historial.poliza, { cascade: true })
  historial: PolizaHistorial[];
}
