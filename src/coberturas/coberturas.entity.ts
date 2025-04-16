import { TiposDeducible } from 'src/tipos-deducible/tipos-deducible.entity';
import { TiposMoneda } from 'src/tipos-moneda/tipos-moneda.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('Coberturas')
export class Coberturas {
  @PrimaryGeneratedColumn()
  CoberturaID: number;

  @Column()
  NombreCobertura: string;

  @Column('text')
  Descripcion: string;

  @Column('decimal', { precision: 10, scale: 2 })
  PrimaBase: number;

  @Column('decimal', { precision: 10, scale: 2 })
  SumaAseguradaMin: number;

  @Column('decimal', { precision: 10, scale: 2 })
  SumaAseguradaMax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  DeducibleMin: number;

  @Column('decimal', { precision: 10, scale: 2 })
  DeducibleMax: number;

  @Column('decimal', { precision: 5, scale: 2 })
  PorcentajePrima: number;

  @Column('decimal', { precision: 5, scale: 2 })
  RangoSeleccion: number;

  @Column('boolean', { default: false })
  EsCoberturaEspecial: boolean;

  @Column('boolean', { default: false })
  Variable: boolean;

  @Column('boolean', { default: false })
  SinValor: boolean;

  @Column('boolean', { default: false })
  AplicaSumaAsegurada: boolean;

  @Column('boolean', { default: false })
  IndiceSiniestralidad: boolean;

  @Column('boolean', { default: false })
  CoberturaAmparada: boolean;

  @Column('boolean', { default: false })
  sumaAseguradaPorPasajero: boolean;

  @Column('decimal', { precision: 10, scale: 2 })
  primaMinima: number;

  @Column('decimal', { precision: 10, scale: 2 })
  primaMaxima: number;

  @Column('decimal', { precision: 10, scale: 2 })
  factorDecrecimiento: number;

  @Column('decimal', { precision: 10, scale: 2 })
  rangoCobertura: number;
  
  @ManyToOne(() => TiposDeducible, { nullable: true })
  @JoinColumn({ name: 'TipoDeducibleID' })
  tipoDeducible: TiposDeducible;

  @ManyToOne(() => TiposMoneda, { nullable: true })
  @JoinColumn({ name: 'TipoMonedaID' })
  tipoMoneda: TiposMoneda;
}
