import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TipoPago')
export class TipoPago {
  @PrimaryGeneratedColumn()
  TipoPagoID: number;

  @Column({ length: 255, nullable: true })
  Descripcion: string;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  PorcentajeAjuste: number;
  
  @Column({ type: 'int', nullable: true })
  Divisor: number;
}
