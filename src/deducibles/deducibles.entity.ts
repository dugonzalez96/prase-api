import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Deducibles')
export class Deducibles {
  @PrimaryGeneratedColumn()
  DeducibleID: number;

  @Column('decimal', { precision: 10, scale: 2 })
  DeducibleMinimo: number;

  @Column('decimal', { precision: 10, scale: 2 })
  DeducibleMaximo: number;

  @Column('varchar', { length: 255 })  // Nueva columna "Rango"
  Rango: string;
}
