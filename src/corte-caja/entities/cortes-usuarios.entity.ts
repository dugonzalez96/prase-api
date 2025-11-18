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
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';
import { Transacciones } from 'src/transacciones/entities/transacciones.entity';
import { PagosPoliza } from 'src/pagos-poliza/entities/pagos-poliza.entity';
import { CajaChica } from 'src/caja-chica/entities/caja-chica.entity';

@Entity('CortesUsuarios')
export class CortesUsuarios {
  @PrimaryGeneratedColumn()
  CorteUsuarioID: number;

  @ManyToOne(() => IniciosCaja, { nullable: true })
  @JoinColumn({ name: 'InicioCajaID' })
  InicioCaja: IniciosCaja;

  @ManyToOne(() => Sucursal, { nullable: false })
  @JoinColumn({ name: 'SucursalID' })
  Sucursal: Sucursal;

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

  @OneToMany(() => Transacciones, (t) => t.CorteUsuario)
  Transacciones: Transacciones[];

  @OneToMany(() => PagosPoliza, (p) => p.CorteUsuario)
  PagosPoliza: PagosPoliza[];

  @ManyToOne(() => CajaChica, (caja) => caja.CortesUsuarios, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'CajaChicaID' })
  CajaChica: CajaChica | null;
}
