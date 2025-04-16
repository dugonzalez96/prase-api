import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DetallesCotizacionPoliza } from './detalle-cotizacion-poliza.entity';
import { Empleado } from 'src/empleados/entity/empleado.entity';

@Entity('Cotizaciones')
export class Cotizacion {
  @PrimaryGeneratedColumn()
  CotizacionID: number;

  @Column({ nullable: true })
  UsuarioID: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  FechaCotizacion: Date;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  PrimaTotal: number;

  @Column({
    type: 'enum',
    enum: ['REGISTRO', 'EMITIDA', 'ACEPTADA', 'ACTIVA', 'RECHAZADA'],
    default: 'REGISTRO',
  })
  EstadoCotizacion: string;

  @Column({ nullable: true })
  TipoPagoID: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  PorcentajeDescuento: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  DerechoPoliza: number;

  @Column({ nullable: true })
  TipoSumaAseguradaID: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  SumaAsegurada: number;

  @Column({ nullable: true })
  PeriodoGracia: number;

  @Column({ nullable: true })
  PaqueteCoberturaID: number;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  FechaUltimaActualizacion: Date;

  @Column({ nullable: true })
  UsoVehiculo: number;

  @Column({ nullable: true })
  TipoVehiculo: number;

  @Column({ length: 400, nullable: true })
  NombrePersona: string;

  @Column({ type: 'tinyint', nullable: true })
  UnidadSalvamento: boolean;

  @Column({ length: 20, nullable: true })
  VIN: string;

  @Column({ length: 10, nullable: true })
  CP: string;

  @Column({ length: 255 })
  Marca: string;

  @Column({ length: 255 })
  Submarca: string;

  @Column({ length: 255 })
  Modelo: string;

  @Column({ length: 255 })
  Version: string;

  @OneToMany(() => DetallesCotizacionPoliza, (detalle) => detalle.cotizacion, {
    cascade: true,
  })
  detalles: DetallesCotizacionPoliza[];

  @Column('text', { nullable: true })
  Correo: string;

  @Column('text', { nullable: true })
  Telefono: string;

  @Column({ length: 255 })
  NoMotor: string;

  @Column({ length: 255 })
  Placa: string;

  @Column({ nullable: true })
  NumOcupantes: number;

  @Column({ nullable: false })
  UsuarioRegistro: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  CostoBase: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  AjusteSiniestralidad: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  AjusteCP: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  AjusteTipoPago: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  SubtotalSiniestralidad: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  SubtotalTipoPago: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  CostoNeto: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  IVA: number;
}
