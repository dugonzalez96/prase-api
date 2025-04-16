import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TiposMoneda')
export class TiposMoneda {
  @PrimaryGeneratedColumn()
  TipoMonedaID: number;

  @Column()
  Nombre: string;

  @Column({ length: 10 })
  Abreviacion: string;
}
