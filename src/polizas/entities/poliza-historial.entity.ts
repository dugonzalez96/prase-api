import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Poliza } from './poliza.entity';
import { TipoPago } from 'src/tipos-pago/tipo-pago.entity';


@Entity('PolizaHistorial')
export class PolizaHistorial {
  @PrimaryGeneratedColumn()
  HistorialID: number;
 
  @ManyToOne(() => Poliza, (poliza) => poliza.historial, { nullable: false })
  @JoinColumn({ name: 'PolizaID' })
  poliza: Poliza;  
  
  @Column({ nullable: true })
  NumeroPoliza: string;

  @Column('decimal', { precision: 3, scale: 1 })
  Version: number;

  @Column({ type: 'date', nullable: true })
  FechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  FechaFin: Date;

  @Column({ length: 255, nullable: true })
  EstadoPoliza: string;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  TotalPagos: number;

  @Column('int', { nullable: true })
  NumeroPagos: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  MontoPorPago: number;

  @ManyToOne(() => TipoPago, { nullable: true })
  @JoinColumn({ name: 'TipoPagoID' })
  tipoPago: TipoPago;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  DescuentoProntoPago: number;

  @Column({ type: 'date', nullable: true })
  FechaCancelacion: Date;

  @Column('text', { nullable: true })
  MotivoCancelacion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  FechaVersion: Date;
}
