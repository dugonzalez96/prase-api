import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IniciosCaja } from 'src/inicios-caja/entities/inicios-caja.entity';
import { usuarios } from 'src/users/users.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Entity('Transacciones')
export class Transacciones {
  @PrimaryGeneratedColumn()
  TransaccionID: number;

  @ManyToOne(() => IniciosCaja, { nullable: true })
  @JoinColumn({ name: 'InicioCajaID' })
  InicioCaja: IniciosCaja;

  @Column({
    type: 'enum',
    enum: ['Ingreso', 'Egreso'],
    nullable: false,
  })
  TipoTransaccion: 'Ingreso' | 'Egreso';

  // 🔹 NUEVA BANDERA
  @Column({ type: 'tinyint', default: 0 })
  EsGeneral: boolean; // 0 = Caja Chica, 1 = Caja General

  @Column({
    type: 'enum',
    enum: ['Efectivo', 'Transferencia', 'Deposito', 'Tarjeta'],
    nullable: false,
  })
  FormaPago: 'Efectivo' | 'Transferencia' | 'Deposito' | 'Tarjeta';

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  Monto: number;

  @Column('tinyint', { default: 0 })
  Validado: boolean;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioCreoID' })
  UsuarioCreo: usuarios;

  @ManyToOne(() => usuarios, { nullable: true })
  @JoinColumn({ name: 'UsuarioValidoID' })
  UsuarioValido: usuarios;

  @ManyToOne(() => CuentasBancarias, { nullable: true })
  @JoinColumn({ name: 'CuentaBancariaID' })
  CuentaBancaria: CuentasBancarias;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  FechaTransaccion: Date;

  @UpdateDateColumn({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  FechaActualizacion: Date;

  @Column({ length: 255, nullable: true })
  Descripcion: string;
}
