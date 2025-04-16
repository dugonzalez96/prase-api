import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { grupos } from '../groups/groups.entity';
import { aplicaciones } from '../applications/applications.entity';

@Entity('aplicaciones_grupos')  // Usa el nombre exacto de la tabla en la base de datos
export class ApplicationsGrupos {
  @PrimaryGeneratedColumn()
  id: number;  // Esta columna será generada automáticamente por MySQL

  @ManyToOne(() => aplicaciones)  // Relación Many-to-One con aplicaciones
  @JoinColumn({ name: 'aplicaciones_id' })  // Nombre correcto de la columna en la tabla
  aplicaciones: aplicaciones;

  @ManyToOne(() => grupos)  // Relación Many-to-One con grupos
  @JoinColumn({ name: 'grupos_id' })  // Nombre correcto de la columna en la tabla
  grupos: grupos;

  @Column({ default: false })
  ingresar: boolean;

  @Column({ default: false })
  insertar: boolean;

  @Column({ default: false })
  eliminar: boolean;

  @Column({ default: false })
  actualizar: boolean;
}
