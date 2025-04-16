import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('MetodosPago')
export class MetodosPago {
  @PrimaryGeneratedColumn()
  IDMetodoPago: number;

  @Column({ length: 255 })
  NombreMetodo: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  FechaCreacion: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  FechaActualizacion: Date;
}
