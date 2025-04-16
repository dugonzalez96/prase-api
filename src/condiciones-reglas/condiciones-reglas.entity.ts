import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReglasNegocio } from '../reglas-negocio/reglas-negocio.entity';
import { TiposMoneda } from '../tipos-moneda/tipos-moneda.entity'; // Importa la entidad TiposMoneda

@Entity('CondicionesReglas')
export class CondicionesReglas {
  @PrimaryGeneratedColumn()
  CondicionID: number;

  @Column({ length: 255, nullable: true })
  Campo: string;

  @Column('enum', { enum: ['>', '<', '=', '>=', '<=', 'IN'], nullable: true })
  Operador: '>' | '<' | '=' | '>=' | '<=' | 'IN';

  @Column({ length: 255, nullable: true })
  Valor: string;

  @Column({ length: 255, nullable: true })
  Evaluacion: string;

  // Relación con ReglasNegocio
  @ManyToOne(() => ReglasNegocio, (regla) => regla.condiciones)
  @JoinColumn({ name: 'ReglaID' }) // Esto asegura que la columna en la base de datos sea 'ReglaID'
  regla: ReglasNegocio;
}
