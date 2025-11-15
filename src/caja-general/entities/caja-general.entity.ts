import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { usuarios } from 'src/users/users.entity';

export type EstatusCajaGeneral = 'Pendiente' | 'Cerrado' | 'Cancelado';

@Entity('CajaGeneral')
export class CajaGeneral {
  @PrimaryGeneratedColumn()
  CajaGeneralID: number;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  Fecha: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @Column({ type: 'datetime', nullable: true })
  FechaCierre: Date | null;

  // Relación con Sucursal
  @ManyToOne(() => Sucursal, { nullable: true })
  @JoinColumn({ name: 'SucursalID' })
  Sucursal: Sucursal | null;

  // Saldos principales
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  SaldoAnterior: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  IngresosCajaChica: number;

  // Totales
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  TotalIngresos: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  TotalEgresos: number;

  // Desglose por medio
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  TotalEfectivo: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  TotalPagoConTarjeta: number;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  TotalTransferencia: number;

  // Capturas físicas
  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  SaldoEsperado: number | null;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  SaldoReal: number | null;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  TotalEfectivoCapturado: number | null;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  TotalTarjetaCapturado: number | null;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  TotalTransferenciaCapturado: number | null;

  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  Diferencia: number;

  // Saldo final oficial
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  SaldoFinal: number;

  // Auditoría
  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioCuadreID' })
  UsuarioCuadre: usuarios | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  FolioCierre: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Observaciones: string | null;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Cerrado', 'Cancelado'],
    default: 'Pendiente',
  })
  Estatus: EstatusCajaGeneral;
}
