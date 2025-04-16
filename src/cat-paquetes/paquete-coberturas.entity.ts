import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PaqueteCoberturas')
export class PaqueteCoberturas {
  @PrimaryGeneratedColumn()
  PaqueteCoberturaID: number;

  @Column()
  NombrePaquete: string;

  @Column('text')
  DescripcionPaquete: string;
  
  @Column('decimal', { precision: 5, scale: 2 })
  PrecioTotalFijo: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  FechaCreacion: Date;
}
