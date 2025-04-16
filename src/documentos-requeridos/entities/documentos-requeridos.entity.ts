import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('DocumentosRequeridos')
export class DocumentosRequeridos {
  @PrimaryGeneratedColumn()
  DocumentoID: number;

  @Column({ length: 255, nullable: true })
  NombreDocumento: string;

  @Column('text', { nullable: true })
  Descripcion: string;
}
