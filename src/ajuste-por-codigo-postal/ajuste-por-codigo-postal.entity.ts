import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('AjustePorCodigoPostal')
export class AjustePorCodigoPostal {
  @PrimaryColumn({ length: 10 })
  CodigoPostal: string;

  @Column('decimal', { precision: 5, scale: 2 })
  IndiceSiniestros: number;

  @Column('decimal', { precision: 5, scale: 2 })
  AjustePrima: number;

  @Column('int', { nullable: true, default: null })
  CantSiniestros: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  UltimaActualizacion: Date;
}
