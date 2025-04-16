import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('CuentasBancarias')
export class CuentasBancarias {
  @PrimaryGeneratedColumn()
  CuentaBancariaID: number;

  @Column({ type: 'varchar', length: 100, collation: 'utf8mb4_0900_ai_ci' })
  NombreBanco: string;

  @Column({ type: 'varchar', length: 20, collation: 'utf8mb4_0900_ai_ci' })
  NumeroCuenta: string;

  @Column({ type: 'varchar', length: 18, nullable: true, collation: 'utf8mb4_0900_ai_ci', default: null })
  ClabeInterbancaria?: string;

  @Column({ type: 'tinyint', default: 1 })
  Activa: boolean;
}
