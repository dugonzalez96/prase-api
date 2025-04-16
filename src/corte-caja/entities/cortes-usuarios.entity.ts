import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';

@Entity('CortesUsuarios')
export class CortesUsuarios {
  @PrimaryGeneratedColumn()
  CorteUsuarioID: number;

  @ManyToOne(() => IniciosCaja, { nullable: true })
  @JoinColumn({ name: 'InicioCajaID' })
  InicioCaja: IniciosCaja;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'usuarioID' })
  usuarioID: usuarios; // Relación con usuarios

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  FechaCorte: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  TotalIngresos: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalIngresosEfectivo: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalIngresosTarjeta: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalIngresosTransferencia: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  TotalEgresos: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalEgresosEfectivo: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalEgresosTarjeta: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalEgresosTransferencia: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalEfectivo: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalPagoConTarjeta: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalTransferencia: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  SaldoEsperado: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  SaldoReal: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalEfectivoCapturado: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalTarjetaCapturado: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0.0 })
  TotalTransferenciaCapturado: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  Diferencia: number;

  @Column({ length: 255, nullable: true })
  Observaciones: string;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Cerrado', 'Validado', 'Cancelado'],
    default: 'Pendiente',
    nullable: true,
  })
  Estatus: 'Pendiente' | 'Cerrado' | 'Validado' | 'Cancelado';
}
