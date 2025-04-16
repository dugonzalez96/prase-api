import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('aplicaciones')  // Especificamos el nombre de la tabla si es diferente al nombre de la entidad
export class aplicaciones {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column({ nullable: true })  // Ya que `icon` puede ser NULL, usamos nullable
  icon: string;

  @Column({ nullable: true })  // Ya que `color` puede ser NULL, usamos nullable
  color: string;

  @Column({
    type: 'enum',
    enum: ['Administración', 'Catalogos', 'Cotizaciones', 'Siniestros', 'Reportería', 'Control de Cajas', 'Recursos Humanos'],
    default: 'Administración',
  })
  categoria: string;
}
