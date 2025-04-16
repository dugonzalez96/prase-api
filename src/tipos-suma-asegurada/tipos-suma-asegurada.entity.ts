import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('TiposSumaAsegurada')
export class TiposSumaAsegurada {
  @PrimaryGeneratedColumn()
  TipoSumaAseguradaID: number;

  @Column({ length: 255 })
  NombreTipo: string;

  @Column('text')
  DescripcionSuma: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  FechaCreacion: Date;
}
