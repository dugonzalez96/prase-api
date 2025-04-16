import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

import { DocumentosRequeridos } from 'src/documentos-requeridos/entities/documentos-requeridos.entity';
import { Poliza } from 'src/polizas/entities/poliza.entity';

@Entity('DocumentosDigitalizados')
export class DocumentosDigitalizados {
  @PrimaryGeneratedColumn()
  DocumentoDigitalizadoID: number;

  @ManyToOne(() => Poliza, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'PolizaID' })
  Poliza: Poliza;

  @ManyToOne(() => DocumentosRequeridos, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'DocumentoID' })
  Documento: DocumentosRequeridos;

  @Column({ length: 255, nullable: true })
  RutaArchivo: string;

  @Column({ type: 'timestamp', nullable: true })
  FechaCarga: Date;

  @Column({ length: 255, nullable: true })
  EstadoDocumento: string;
}
