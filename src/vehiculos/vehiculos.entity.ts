import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Vehiculos')
export class Vehiculos {
  @PrimaryGeneratedColumn()
  VehiculoID: number;

  @Column({ type: 'int', nullable: true })  // Elimina la relación y deja ClienteID como un campo simple
  ClienteID: number;

  @Column({ length: 255, nullable: true })
  Marca: string;

  @Column({ length: 255, nullable: true })
  Submarca: string;

  @Column({ length: 255, nullable: true })
  Version: string;

  @Column({ type: 'int', nullable: true })
  Modelo: number;

  @Column({ length: 255, nullable: true })
  TipoVehiculo: string;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ValorVehiculo: number;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  ValorFactura: number;

  @Column('timestamp', { nullable: true })
  FechaRegistro: Date;

  @Column({ length: 255, nullable: true })
  UsoVehiculo: string;

  @Column({ length: 255, nullable: true })
  ZonaResidencia: string;

  @Column({ length: 50, nullable: true })
  NoMotor: string;

  @Column({ length: 50, nullable: true })
  VIN: string;

  @Column({ length: 50, nullable: true })
  Placas: string;

  @Column({ type: 'int', nullable: true })
  Salvamento: number;
}
