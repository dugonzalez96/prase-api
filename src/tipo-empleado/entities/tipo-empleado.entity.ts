import { Empleado } from 'src/empleados/entity/empleado.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';


@Entity('TiposEmpleado')
export class TipoEmpleado {
  @PrimaryGeneratedColumn()
  TipoEmpleadoID: number;

  @Column({ length: 100 })
  Descripcion: string;

  @OneToMany(() => Empleado, (empleado) => empleado.TipoEmpleado)
  empleados: Empleado[];
}
