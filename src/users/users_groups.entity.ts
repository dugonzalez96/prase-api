import { Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { grupos } from '../groups/groups.entity';
import { usuarios } from '../users/users.entity';

@Entity()
export class grupos_has_usuarios {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => grupos)  // Relación Many-to-One con la entidad grupos
  @JoinColumn({ name: 'grupos_id' })  // Asignar la columna de relación a 'grupos_id'
  grupos: grupos;

  @ManyToOne(() => usuarios)  // Relación Many-to-One con la entidad usuarios
  @JoinColumn({ name: 'usuarios_UsuarioID' })  // Asignar la columna de relación a 'usuarios_UsuarioID'
  usuarios: usuarios;
}
