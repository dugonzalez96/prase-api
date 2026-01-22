import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Empleado } from 'src/empleados/entity/empleado.entity';

@Entity()
export class usuarios {
  @PrimaryGeneratedColumn()
  UsuarioID: number;

  @Column()
  NombreUsuario: string;

  @Column()
  Contrasena: string; // Almacenamos contraseñas en texto plano solo para el ejemplo

  @Column()
  EmpleadoID: number;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'EmpleadoID' })
  Empleado: Empleado;

  @Column()
  SucursalID: number;
}
