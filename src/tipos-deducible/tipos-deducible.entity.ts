import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TiposDeducible')
export class TiposDeducible {
  @PrimaryGeneratedColumn()
  TipoDeducibleID: number;

  @Column()
  Nombre: string;
}
