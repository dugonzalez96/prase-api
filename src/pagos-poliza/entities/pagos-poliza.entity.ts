import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EstatusPago } from 'src/estatus-pago/entities/estatus-pago.entity';
import { MetodosPago } from 'src/metodos-pago/entities/metodos-pago.entity';
import { usuarios } from 'src/users/users.entity';
import { CuentasBancarias } from 'src/cuentas-bancarias/entities/cuentas-bancarias.entity';

@Entity('PagosPoliza')
export class PagosPoliza {
  @PrimaryGeneratedColumn()
  PagoID: number;

  @Column({ nullable: true })
  PolizaID: number;

  @Column({ type: 'datetime', nullable: true })
  FechaPago: Date;

  @Column('decimal', { precision: 10, scale: 0, nullable: true })
  MontoPagado: number;

  @Column({ length: 255, nullable: true })
  ReferenciaPago: string;

  @Column({ length: 255, nullable: true })
  NombreTitular: string;

  @Column({ type: 'datetime', nullable: true })
  FechaMovimiento: Date;

  @ManyToOne(() => MetodosPago, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'IDMetodoPago' })
  MetodoPago: MetodosPago;

  @ManyToOne(() => EstatusPago, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'IDEstatusPago' })
  EstatusPago: EstatusPago;

  @ManyToOne(() => usuarios, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'UsuarioID' })
  Usuario: usuarios;

  @ManyToOne(() => usuarios, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'UsuarioValidoID' })
  UsuarioValido: usuarios;

  @ManyToOne(() => CuentasBancarias, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'CuentaBancariaID' })
  CuentaBancaria: CuentasBancarias;

  @Column({ type: 'tinyint', default: 0 })
  Validado: boolean;

  @Column({ length: 255, nullable: true })
  MotivoCancelacion: string;
}
