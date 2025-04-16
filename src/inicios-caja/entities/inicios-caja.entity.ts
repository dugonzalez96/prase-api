import { usuarios } from 'src/users/users.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('IniciosCaja')
export class IniciosCaja {
  @PrimaryGeneratedColumn()
  InicioCajaID: number;

  @ManyToOne(() => usuarios, { nullable: false })
  @JoinColumn({ name: 'UsuarioID' })
  Usuario: usuarios;

  @ManyToOne(() => usuarios, { nullable: false })
  @JoinColumn({ name: 'UsuarioAutorizoID' })
  UsuarioAutorizo: usuarios;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  FechaInicio: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: false, default: 0.0  })
  MontoInicial: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false, default: 0.0 })
  TotalEfectivo: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false, default: 0.0 })
  TotalTransferencia: number;

  @Column({ type: 'text', nullable: true })
  FirmaElectronica: string; // Puede ser un hash, una imagen o un archivo codificado en Base64

  @Column({
    type: 'enum',
    enum: ['Activo', 'Cerrado', 'Pendiente'],
    default: 'Activo',
    nullable: true,
  })
  Estatus: 'Activo' | 'Cerrado' | 'Pendiente';
}
