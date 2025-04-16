import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { PaqueteCoberturas } from '../cat-paquetes/paquete-coberturas.entity';
import { Coberturas } from '../coberturas/coberturas.entity';

@Entity('PaqueteCobertura_Cobertura')
export class PaqueteCobertura_Cobertura {
  @PrimaryColumn()
  PaqueteCoberturaID: number;

  @PrimaryColumn()
  CoberturaID: number;

  @ManyToOne(() => PaqueteCoberturas)
  @JoinColumn({ name: 'PaqueteCoberturaID' })  // Relacionar con la columna de clave foránea
  paquete: PaqueteCoberturas;

  @ManyToOne(() => Coberturas)
  @JoinColumn({ name: 'CoberturaID' })  // Relacionar con la columna de clave foránea
  cobertura: Coberturas;

  @Column('timestamp')
  FechaAsociacion: Date;

  @Column()
  Obligatoria: boolean;

}
