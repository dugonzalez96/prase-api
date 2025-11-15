import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { usuarios } from 'src/users/users.entity';
import { Sucursal } from 'src/sucursales/entities/sucursales.entity';

export type EstatusInicioCaja = 'Activo' | 'Cerrado' | 'Pendiente';

@Entity('IniciosCaja')
export class IniciosCaja {
  @PrimaryGeneratedColumn()
  InicioCajaID: number;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioID' })
  Usuario: usuarios;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioAutorizoID' })
  UsuarioAutorizo: usuarios;

  @ManyToOne(() => Sucursal, { nullable: true })
  @JoinColumn({ name: 'SucursalID' })
  Sucursal: Sucursal | null;

  @CreateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  FechaInicio: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  MontoInicial: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  TotalEfectivo: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  TotalTransferencia: number;

  @Column({
    type: 'enum',
    enum: ['Activo', 'Cerrado', 'Pendiente'],
    default: 'Activo',
  })
  Estatus: EstatusInicioCaja;

  @Column({ type: 'text', nullable: true })
  FirmaElectronica: string | null;
}
