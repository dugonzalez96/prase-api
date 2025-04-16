import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('BitacoraEdiciones')  // Nombre exacto de la tabla
export class BitacoraEdiciones {
  @PrimaryGeneratedColumn()
  BitacoraID: number;

  @Column()
  Entidad: string;  // Nombre de la entidad o tabla

  @Column()
  EntidadID: number;  // ID del registro modificado

  @Column('json')
  CamposModificados: Record<string, any>;  // JSON con los campos modificados y sus valores

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  FechaEdicion: Date;  // Fecha y hora de la edición

  @Column()
  UsuarioEdicion: string;  // Usuario que realizó la edición
}
