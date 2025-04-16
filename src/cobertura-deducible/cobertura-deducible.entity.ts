import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Coberturas } from '../coberturas/coberturas.entity';
import { Deducibles } from '../deducibles/deducibles.entity';

@Entity('Cobertura_Deducible')
export class Cobertura_Deducible {
  @PrimaryGeneratedColumn()
  CoberturaDeducibleID: number;

  @ManyToOne(() => Coberturas)
  @JoinColumn({ name: 'CoberturaID' })  // Especificar la columna de clave foránea
  cobertura: Coberturas;

  @ManyToOne(() => Deducibles)
  @JoinColumn({ name: 'DeducibleID' })  // Especificar la columna de clave foránea
  deducible: Deducibles;
}
