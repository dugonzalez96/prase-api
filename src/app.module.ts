import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { usuarios } from './users/users.entity';
import { grupos } from "./groups/groups.entity";
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from "./groups/groups.module";
import { ApplicationsModule } from './applications/applications.module';
import { aplicaciones } from './applications/applications.entity';
import { grupos_has_usuarios } from './users/users_groups.entity';
import { PaqueteCoberturasModule } from './cat-paquetes/paquete-coberturas.module';
import { PaqueteCoberturas } from './cat-paquetes/paquete-coberturas.entity';
import { BitacoraEliminacionesModule } from './bitacora-eliminaciones/bitacora-eliminaciones.module';
import { BitacoraEliminaciones } from './bitacora-eliminaciones/bitacora-eliminaciones.entity';
import { BitacoraEdicionesModule } from './bitacora-ediciones/bitacora-ediciones.module';
import { BitacoraEdiciones } from './bitacora-ediciones/bitacora-ediciones.entity';
import { CoberturasModule } from './coberturas/coberturas.module';
import { Coberturas } from './coberturas/coberturas.entity';
import { PaqueteCobertura_CoberturaModule } from './paquete-cobertura-cobertura/paquete-cobertura-cobertura.module';
import { PaqueteCobertura_Cobertura } from './paquete-cobertura-cobertura/paquete-cobertura-cobertura.entity';  // Importa la entidad
import { Deducibles } from './deducibles/deducibles.entity';
import { DeduciblesModule } from './deducibles/deducibles.module';
import { CoberturaDeducibleModule } from './cobertura-deducible/cobertura-deducible.module';
import { Cobertura_Deducible } from './cobertura-deducible/cobertura-deducible.entity';
import { TiposSumaAsegurada } from './tipos-suma-asegurada/tipos-suma-asegurada.entity';
import { TiposSumaAseguradaModule } from './tipos-suma-asegurada/tipos-suma-asegurada.module';
import { ConfiguracionesSistemaModule } from './configuraciones-sistema/configuraciones-sistema.module';
import { ConfiguracionesSistema } from './configuraciones-sistema/configuraciones-sistema.entity';
import { ReglasNegocioModule } from './reglas-negocio/reglas-negocio.module';
import { ReglasNegocio } from './reglas-negocio/reglas-negocio.entity';
import { CondicionesReglasModule } from './condiciones-reglas/condiciones-reglas.module';
import { CondicionesReglas } from './condiciones-reglas/condiciones-reglas.entity';
import { AplicacionReglasModule } from './aplicacion-reglas/aplicacion-reglas.module';
import { AplicacionReglas } from './aplicacion-reglas/aplicacion-reglas.entity';
import { AjustePorCodigoPostal } from './ajuste-por-codigo-postal/ajuste-por-codigo-postal.entity';
import { AjustePorCodigoPostalModule } from './ajuste-por-codigo-postal/ajuste-por-codigo-postal.module';
import { Clientes } from './clientes/clientes.entity';
import { Vehiculos } from './vehiculos/vehiculos.entity';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ApplicationsGrupos } from './aplicaciones-grupos/aplicaciones-grupos.entity';
import { ApplicationsGruposModule } from './aplicaciones-grupos/aplicaciones-grupos.module';
import { Cotizacion } from './cotizaciones/entities/cotizacion.entity';
import { DetallesCotizacionPoliza } from './cotizaciones/entities/detalle-cotizacion-poliza.entity';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { TiposDeducible } from './tipos-deducible/tipos-deducible.entity';
import { TiposMoneda } from './tipos-moneda/tipos-moneda.entity';
import { TiposDeducibleModule } from './tipos-deducible/tipos-deducible.module';
import { TiposMonedaModule } from './tipos-moneda/tipos-moneda.module';
import { UsosVehiculo } from './usos-vehiculo/usos-vehiculo.entity';
import { UsosVehiculoModule } from './usos-vehiculo/usos-vehiculo.module';
import { TiposVehiculoModule } from './tipos-vehiculo/tipos-vehiculo.module';
import { TiposVehiculo } from './tipos-vehiculo/tipos-vehiculo.entity';
import { GeoapifyModule } from './geoapify/geoapify.module';
import { TipoPago } from './tipos-pago/tipo-pago.entity';
import { TipoPagoModule } from './tipos-pago/tipo-pago.module';
import { DatabaseModule } from './database/database.module';
import { MailerModule } from './mailer/mailer.module';
import { PolizasModule } from './polizas/polizas.module';
import { Poliza } from './polizas/entities/poliza.entity';
import { PolizaHistorial } from './polizas/entities/poliza-historial.entity';
import { TipoEmpleado } from './tipo-empleado/entities/tipo-empleado.entity';
import { Empleado } from './empleados/entity/empleado.entity';
import { EmpleadoModule } from './empleados/empleado.module';
import { TipoEmpleadoModule } from './tipo-empleado/tipo-empleado.module';
import { MetodosPago } from './metodos-pago/entities/metodos-pago.entity';
import { EstatusPago } from './estatus-pago/entities/estatus-pago.entity';
import { PagosPoliza } from './pagos-poliza/entities/pagos-poliza.entity';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { EstatusPagoModule } from './estatus-pago/estatus-pago.module';
import { PagosPolizaModule } from './pagos-poliza/pagos-poliza.module';
import { DocumentosDigitalizadosModule } from './documentos-digitalizados/documentos-digitalizados.module';
import { DocumentosRequeridosModule } from './documentos-requeridos/documentos-requeridos.module';
import { DocumentosRequeridos } from './documentos-requeridos/entities/documentos-requeridos.entity';
import { DocumentosDigitalizados } from './documentos-digitalizados/entities/documentos-digitalizados.entity';
import { CuentasBancarias } from './cuentas-bancarias/entities/cuentas-bancarias.entity';
import { CuentasBancariasModule } from './cuentas-bancarias/cuentas-bancarias.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { Sucursal } from './sucursales/entities/sucursales.entity';
import { IniciosCaja } from './inicios-caja/entities/inicios-caja.entity';
import { IniciosCajaModule } from './inicios-caja/inicios-caja.module';
import { TransaccionesModule } from './transacciones/transacciones.module';
import { Transacciones } from './transacciones/entities/transacciones.entity';
import { CortesUsuarios } from './corte-caja/entities/cortes-usuarios.entity';
import { CortesUsuariosModule } from './corte-caja/cortes-usuarios.module';
import { CajaChica } from './caja-chica/entities/caja-chica.entity';
import { CajaChicaModule } from './caja-chica/caja-chica.module';
import { CajaGeneral } from './caja-general/entities/caja-general.entity';
import { CajaGeneralModule } from './caja-general/caja-general.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'db1', // Primera conexión
      type: 'mysql',
      host: 'switchyard.proxy.rlwy.net',
      port: 11528,
      username: 'root',
      password: 'efCrJOQYzgfqpsAYJyEZMjzIvnPlITin',
      database: 'prase-db',
      entities: [usuarios, grupos, aplicaciones, grupos_has_usuarios, PaqueteCoberturas, BitacoraEliminaciones, BitacoraEdiciones, Coberturas, PaqueteCobertura_Cobertura, Deducibles, Cobertura_Deducible, TiposSumaAsegurada, ConfiguracionesSistema, ReglasNegocio, CondicionesReglas, AplicacionReglas, AjustePorCodigoPostal, Clientes, Vehiculos, ApplicationsGrupos, Cotizacion, DetallesCotizacionPoliza, TiposDeducible, TiposMoneda, UsosVehiculo,TiposVehiculo, TipoPago,Poliza,PolizaHistorial,TipoEmpleado,Empleado,MetodosPago,EstatusPago,PagosPoliza,DocumentosRequeridos,DocumentosDigitalizados, CuentasBancarias, Sucursal, IniciosCaja,Transacciones,CortesUsuarios, CajaChica, CajaGeneral],
      synchronize: false,
      cache: false,
      //logger: 'simple-console',
      //logging: ['query', 'error']
    }),
    UsersModule,
    AuthModule,
    GroupsModule,
    ApplicationsModule,
    PaqueteCoberturasModule,
    BitacoraEliminacionesModule,
    BitacoraEdicionesModule,
    CoberturasModule,
    PaqueteCobertura_CoberturaModule,
    DeduciblesModule,
    CoberturaDeducibleModule,
    TiposSumaAseguradaModule,
    ConfiguracionesSistemaModule,
    ReglasNegocioModule,
    CondicionesReglasModule,
    AplicacionReglasModule,
    AjustePorCodigoPostalModule,
    VehiculosModule,
    ClientesModule,
    ApplicationsGruposModule,
    CotizacionesModule,
    TiposDeducibleModule,
    TiposMonedaModule,
    UsosVehiculoModule,
    TiposVehiculoModule,
    GeoapifyModule,
    TipoPagoModule,
    MailerModule,
    PolizasModule,
    EmpleadoModule,
    TipoEmpleadoModule,
    MetodosPagoModule,
    EstatusPagoModule,
    PagosPolizaModule,
    DocumentosRequeridosModule,
    DocumentosDigitalizadosModule,
    CuentasBancariasModule,
    SucursalesModule,
    IniciosCajaModule,
    TransaccionesModule,
    CortesUsuariosModule,
    CajaChicaModule,
    CajaGeneralModule
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
