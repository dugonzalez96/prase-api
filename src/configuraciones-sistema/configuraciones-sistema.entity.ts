import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ConfiguracionesSistema')
export class ConfiguracionesSistema {
  @PrimaryGeneratedColumn()
  ConfiguracionID: number;

  @Column({ length: 100 })
  NombreConfiguracion: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0.00 })
  ValorConfiguracion: number;

  @Column('text', { nullable: true })
  Descripcion: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  UltimaActualizacion: Date;
}
