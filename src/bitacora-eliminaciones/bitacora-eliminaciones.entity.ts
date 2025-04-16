import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('BitacoraEliminaciones')
export class BitacoraEliminaciones {
  @PrimaryGeneratedColumn()
  BitacoraID: number;

  @Column()
  Entidad: string;  // Nombre de la entidad o tabla

  @Column()
  EntidadID: number;  // ID del registro eliminado en la entidad

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  FechaEliminacion: Date;  // Fecha y hora de la eliminación

  @Column()
  UsuarioEliminacion: string;  // Usuario que realizó la eliminación

  @Column({ nullable: true })
  MotivoEliminacion?: string;  // Motivo opcional de la eliminación
}
