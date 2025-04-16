import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';

@Entity('DetallesCotizacionPoliza')
export class DetallesCotizacionPoliza {
  @PrimaryGeneratedColumn()
  DetalleID: number;

  @ManyToOne(() => Cotizacion, (cotizacion) => cotizacion.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'CotizacionID' })
  cotizacion: Cotizacion;

  @ManyToOne(() => Poliza, (poliza) => poliza.detalles, { nullable: false })
  @JoinColumn({ name: 'PolizaID' })
  poliza: Poliza;

  @Column({ nullable: false })
  CoberturaID: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  MontoSumaAsegurada: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  MontoDeducible: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  PrimaCalculada: number;

  @Column({ default: false })
  EsPoliza: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  PorcentajePrimaAplicado: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  ValorAseguradoUsado: number;
}
