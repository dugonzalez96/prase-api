import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Sucursales')
export class Sucursal {
  @PrimaryGeneratedColumn()
  SucursalID: number;

  @Column({ length: 100, nullable: false, collation: 'utf8mb4_0900_ai_ci' })
  NombreSucursal: string;

  @Column({ length: 255, nullable: true, collation: 'utf8mb4_0900_ai_ci' })
  Direccion: string;

  @Column({ length: 50, nullable: true, collation: 'utf8mb4_0900_ai_ci' })
  Ciudad: string;

  @Column({ length: 50, nullable: true, collation: 'utf8mb4_0900_ai_ci' })
  Estado: string;

  @Column({ type: 'tinyint', default: 1 })
  Activa: boolean;
}
