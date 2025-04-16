import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  SucursalID: number;
}
