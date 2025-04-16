import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('UsosVehiculo')
export class UsosVehiculo {
  @PrimaryGeneratedColumn()
  UsoID: number;

  @Column({ length: 145, nullable: true })
  Nombre: string;
}
