import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Clientes')
export class Clientes {
  @PrimaryGeneratedColumn()
  ClienteID: number;

  @Column({ length: 255, nullable: true })
  NombreCompleto: string;

  @Column({ type: 'date', nullable: true })
  FechaNacimiento: Date;

  @Column({ length: 255, nullable: true })
  Genero: string;

  @Column({ length: 255, nullable: true })
  Direccion: string;

  @Column({ length: 255, nullable: true })
  Telefono: string;

  @Column({ length: 255, nullable: true })
  Email: string;

  @Column({ type: 'int', nullable: true })
  HistorialSiniestros: number;

  @Column({ type: 'int', nullable: true })
  HistorialReclamos: number;

  @Column({ length: 255, nullable: true })
  ZonaResidencia: string;

  @Column({ length: 50, nullable: true })
  RFC: string;

  @Column({ type: 'timestamp', nullable: true })
  FechaRegistro: Date;
}
