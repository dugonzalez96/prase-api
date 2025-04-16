import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UsosVehiculo } from '../usos-vehiculo/usos-vehiculo.entity';

@Entity('TiposVehiculo')
export class TiposVehiculo {
  @PrimaryGeneratedColumn()
  TipoID: number;

  @Column()
  Nombre: string;

  @ManyToOne(() => UsosVehiculo, { nullable: false })
  @JoinColumn({ name: 'UsoID' })
  uso: UsosVehiculo;
}
