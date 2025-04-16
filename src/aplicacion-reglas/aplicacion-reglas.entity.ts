import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReglasNegocio } from '../reglas-negocio/reglas-negocio.entity';

@Entity('AplicacionReglas')
export class AplicacionReglas {
  @PrimaryGeneratedColumn()
  AplicacionID: number;

  @ManyToOne(() => ReglasNegocio, (regla) => regla.AplicacionReglas)
  @JoinColumn({ name: 'ReglaID' })  // Asegúrate de que el nombre coincida con la columna en la base de datos
  ReglaID: ReglasNegocio;

  @Column({ nullable: true })
  CotizacionID: number;

  @Column({ nullable: true })
  PolizaID: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ValorAplicado: number;

  @Column({ length: 10, nullable: true })
  CodigoPostal: string;
}


/**import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ReglasNegocio } from '../reglas-negocio/reglas-negocio.entity';

@Entity('AplicacionReglas')
export class AplicacionReglas {
  @PrimaryGeneratedColumn()
  AplicacionID: number;

  @ManyToOne(() => ReglasNegocio, (regla) => regla.AplicacionReglas, { nullable: true })
  ReglaID: ReglasNegocio;

  // Las relaciones a Cotizaciones y Polizas las comentamos temporalmente
  // @ManyToOne(() => Cotizaciones, { nullable: true })
  // CotizacionID: Cotizaciones;

  // @ManyToOne(() => Polizas, { nullable: true })
  // PolizaID: Polizas;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ValorAplicado: number;

  @Column({ length: 10, nullable: true })
  CodigoPostal: string;
}
 */