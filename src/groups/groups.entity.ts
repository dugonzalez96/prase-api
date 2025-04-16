import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class grupos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;
}
