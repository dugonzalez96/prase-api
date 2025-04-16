// Entity: Empleado
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEmpleado } from 'src/tipo-empleado/entities/tipo-empleado.entity';

@Entity('Empleados')
export class Empleado {
  @PrimaryGeneratedColumn()
  EmpleadoID: number;

  @Column({ length: 100 })
  Nombre: string;

  @Column({ length: 100 })
  Paterno: string;

  @Column({ length: 100, nullable: true })
  Materno?: string;

  @Column({ type: 'date' })
  FechaNacimiento: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  SueldoQuincenal: number;

  @Column('decimal', { precision: 5, scale: 2 })
  PorcentajeComisiones: number;

  @ManyToOne(() => TipoEmpleado, (tipoEmpleado) => tipoEmpleado.empleados, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'TipoEmpleadoID' })
  TipoEmpleado: TipoEmpleado;
}