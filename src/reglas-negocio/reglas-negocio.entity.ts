import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CondicionesReglas } from '../condiciones-reglas/condiciones-reglas.entity';
import { AplicacionReglas } from '../aplicacion-reglas/aplicacion-reglas.entity';
import { Coberturas } from 'src/coberturas/coberturas.entity';
import { TiposMoneda } from '../tipos-moneda/tipos-moneda.entity';

@Entity('ReglasNegocio')
export class ReglasNegocio {
  @PrimaryGeneratedColumn()
  ReglaID: number;

  @Column({ length: 255, nullable: true })
  NombreRegla: string;

  @Column('text', { nullable: true })
  Descripcion: string;

  @Column('enum', {
    enum: ['Global', 'CoberturaEspecifica'],
    default: 'Global',
  })
  TipoAplicacion: 'Global' | 'CoberturaEspecifica';

  @Column('enum', {
    enum: ['Prima', 'SumaAsegurada', 'Deducible', 'Descuento', 'Bonificacion','TasaBase'],
    nullable: true,
  })
  TipoRegla:
    | 'Prima'
    | 'SumaAsegurada'
    | 'Deducible'
    | 'Descuento'
    | 'Bonificacion'
    | 'TasaBase';

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ValorAjuste: number;

  @Column('boolean', { default: false })
  EsGlobal: boolean;

  @Column('boolean', { default: false })
  Activa: boolean;

  @ManyToOne(() => Coberturas, { nullable: true })
  @JoinColumn({ name: 'CoberturaID' })
  cobertura: Coberturas | null;

  @Column({ nullable: true }) // Campo directo para almacenar el ID de la moneda
  TipoMonedaID: number | null;

  @ManyToOne(() => TiposMoneda, { nullable: true }) // Relación para obtener los datos completos de TiposMoneda
  @JoinColumn({ name: 'TipoMonedaID' })
  tipoMoneda: TiposMoneda | null;

  @OneToMany(() => CondicionesReglas, (condicion) => condicion.regla, {
    cascade: true,
  })
  condiciones: CondicionesReglas[];

  @OneToMany(() => AplicacionReglas, (aplicacion) => aplicacion.ReglaID)
  AplicacionReglas: AplicacionReglas[];
}
