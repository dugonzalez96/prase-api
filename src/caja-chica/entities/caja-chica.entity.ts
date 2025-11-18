// src/caja-chica/entities/caja-chica.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { usuarios } from 'src/users/users.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { CortesUsuarios } from 'src/corte-caja/entities/cortes-usuarios.entity';

export type EstatusCajaChica = 'Pendiente' | 'Cerrado' | 'Cancelado';

@Entity('CajaChica')
export class CajaChica {
  @PrimaryGeneratedColumn()
  CajaChicaID: number;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  Fecha: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @OneToMany(() => CortesUsuarios, (corte) => corte.CajaChica)
  CortesUsuarios: CortesUsuarios[];

  @Column({ type: 'datetime', nullable: true })
  FechaCierre: Date | null;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalIngresos: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalEgresos: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalEfectivo: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalPagoConTarjeta: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalTransferencia: number;

  // >>> Nuevos campos
  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  SaldoEsperado: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  SaldoReal: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalEfectivoCapturado: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalTarjetaCapturado: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true, default: 0 })
  TotalTransferenciaCapturado: number;

  @Column('decimal', { precision: 14, scale: 2, nullable: true })
  Diferencia: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  Observaciones: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  FolioCierre: string | null;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioCuadreID' })
  UsuarioCuadre: usuarios | null;

  @ManyToOne(() => Sucursal, { nullable: false })
  @JoinColumn({ name: 'SucursalID' })
  Sucursal: Sucursal;

  @Column({
    type: 'enum',
    enum: ['Pendiente', 'Cerrado', 'Cancelado'],
    default: 'Pendiente',
  })
  Estatus: EstatusCajaChica;
}
