import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EstatusPago')
export class EstatusPago {
  @PrimaryGeneratedColumn()
  IDEstatusPago: number;

  @Column({ length: 255 })
  NombreEstatus: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  FechaCreacion: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  FechaActualizacion: Date;
}
