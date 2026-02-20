# CLAUDE.md — Sistema PRASE

## Stack
- **Backend**: NestJS + TypeORM + MySQL (2 conexiones: `db1` principal)
- **Lenguaje**: TypeScript strict
- **Auth**: JWT
- **Timezone**: Fechas guardadas en UTC, se convierten al timezone de la Sucursal al mostrar

## Commands
```bash
npm run start:dev    # desarrollo
npm run build        # compilar
npm run test         # tests
```

---

## Arquitectura General

```
src/
  cortes-usuarios/     # Cortes de turno por usuario
  caja-chica/          # Cuadre de caja chica (nivel 2)
  caja-general/        # Cuadre de caja general (nivel 3)
  transacciones/       # Movimientos de dinero (ingresos/egresos)
  pagos-poliza/        # Pagos de pólizas de seguro
  inicios-caja/        # Apertura de caja por usuario
  polizas/             # Pólizas de seguro
  users/               # Usuarios del sistema
  sucursales/          # Sucursales (cada una tiene su timezone)
  bitacora-ediciones/
  bitacora-eliminaciones/
```

---

## Dominio: Conceptos Clave

### Jerarquía de Bloqueos (CRÍTICO)
```
Corte de Usuario  →  bloquea movimientos del turno de ESE usuario
      ↓
Cuadre de Caja Chica  →  bloquea a TODOS los usuarios de la sucursal
      ↓
Cuadre de Caja General  →  bloquea TODO el sistema de la sucursal
```

### InicioCaja
- Cada usuario abre su caja al inicio del turno con un monto inicial
- Tiene `TotalEfectivo` y `TotalTransferencia` como saldo inicial
- Estatus: `Activo` | `Cerrado`
- Si se cancela un corte, el InicioCaja debe volver a `Activo`

### Transacciones
- Movimientos de dinero: `TipoTransaccion`: `Ingreso` | `Egreso`
- `FormaPago`: `Efectivo` | `Tarjeta` | `Transferencia` | `Deposito`
- Tienen `CorteUsuarioID` (null = aún no cortado)
- Tienen `InicioCaja` (puede ser null inicialmente)
- Tienen campo `Validado` (boolean) — las de Tarjeta/Transferencia/Deposito deben validarse antes del corte

### PagosPoliza
- Pagos de pólizas de seguro = también son ingresos en el corte
- Se clasifican por `MetodoPago.NombreMetodo` (NO por IDMetodoPago, los IDs pueden cambiar)
- Catálogo: `Efectivo`, `Tarjeta de Crédito`, `Tarjeta de Débito`, `Transferencia Bancaria`
- Tienen `MotivoCancelacion` (null = activo)
- Tienen `CorteUsuarioID` (null = aún no cortado)

### MetodosPago — Clasificación Correcta
```typescript
// SIEMPRE clasificar por NombreMetodo, no por ID
'Efectivo'              → Efectivo
'Tarjeta de Crédito'    → Tarjeta
'Tarjeta de Débito'     → Tarjeta
'Transferencia Bancaria' → Transferencia
// Fallback por ID: 3=Efectivo, 1=TarjetaCrédito, 4=TarjetaDébito, 2=Transferencia
```

---

## Reglas de Negocio (CRÍTICO — No inventar lógica aquí)

### Corte de Usuario
1. Un usuario puede tener MÚLTIPLES cortes en un día (uno por turno)
2. El corte calcula desde el último corte `Cerrado` (o desde `FechaInicio` del InicioCaja si es el primero)
3. Solo incluye transacciones/pagos donde `CorteUsuarioID IS NULL` (no cortados aún)
4. **El SaldoEsperado = solo efectivo** (no incluye tarjeta ni transferencia)
   - `SaldoEsperado = TotalEfectivo = InicioCaja.TotalEfectivo + ingresosEfectivo - egresosEfectivo`
5. Si hay diferencia entre SaldoEsperado y SaldoReal → se requiere `Observaciones`
6. Si la diferencia > 10% → observaciones con mínimo 10 caracteres
7. Antes de cerrar corte: todas las transacciones de Tarjeta/Transferencia/Deposito deben estar `Validado = true`
8. Al guardar corte: amarrar transacciones y pagosPoliza al corte (`CorteUsuarioID = corteGuardado.id`)
9. Estatus posibles: `Pendiente` | `Cerrado` | `Validado` | `Cancelado`

### Bloqueo post-Corte de Usuario
- Un movimiento (transacción, pagoPoliza) bloqueado = tiene `CorteUsuarioID` de un corte con `Estatus = 'Cerrado'`
- No se puede editar, borrar, ni modificar movimientos anteriores al corte cerrado
- Si el corte se **cancela** → los movimientos se desbloquean automáticamente

### Cancelación/Eliminación de Corte
- **No se puede** cancelar/eliminar si tiene `CajaChica` asociada
- **No se puede** eliminar si `Estatus = 'Cerrado'`
- Al cancelar: cambiar estatus a `Cancelado`, reactivar `InicioCaja` a `Activo`
- Cancelación requiere código de autorización (generado previamente por endpoint separado)
- Todo se registra en `BitacoraEliminaciones`

### Cuadre de Caja Chica
- **No se puede cuadrar** si existe algún usuario con movimientos del día sin corte hecho
- Al cuadrarse: bloquea a TODOS los usuarios de la sucursal (no pueden hacer ningún movimiento)
- **Excepción**: Caja General NO se bloquea por el cuadre de caja chica
- Para hacer algún movimiento: eliminar cuadre → hacer movimiento → volver a cuadrar
- Un corte de usuario no se puede eliminar/cancelar si tiene `CajaChica` asociada

### Cuadre de Caja General
- **No se puede cuadrar** si no existe cuadre de caja chica previo
- Al cuadrarse: bloquea TODO el sistema de la sucursal (absolutamente nadie puede hacer nada)
- Los movimientos de Caja General no se bloquean por corte de usuario ni por cuadre de caja chica
- Es el nivel más alto de la jerarquía

---

## Patrones de Código

### Timezone — Siempre usar helpers del servicio
```typescript
// Las fechas se guardan en UTC en la DB
// Al mostrar: convertir con el timezone de la Sucursal
private getTimezoneOffset(timezone?: string): string  // retorna '-07:00' etc.
private convertUTCToLocal(dateUTC: Date, timezoneOffset: string): Date
```

### Consultas con fechas — Usar DATE() en queries crudas
```typescript
// Para comparar fechas sin hora, usar DATE() en QueryBuilder:
.andWhere('DATE(t.FechaTransaccion) >= :fecha', { fecha: 'YYYY-MM-DD' })
// NO usar Between() con fechas completas para comparaciones de día
```

### Precisión decimal — Siempre redondear a 2 decimales
```typescript
const total = Number((valor1 + valor2).toFixed(2));
```

### Relaciones TypeORM
- Conexión: `'db1'` en todos los `@InjectRepository`
- Nombre de entidades: PascalCase con nombres en español (`CortesUsuarios`, `PagosPoliza`, etc.)
- Campos de usuario: `usuarioID` (propietario del corte), `UsuarioCreador` (quien lo creó — puede ser diferente)

### Nombre completo de empleado
```typescript
// El usuario tiene → usuario.Empleado → { Nombre, Paterno, Materno }
// Usar el helper getNombreCompletoEmpleado(usuario)
// Fallback: usuario.NombreUsuario
```

---

## Errores Conocidos / Issues Activos

### Back (pendientes de resolver)
- **Issue 6**: Validación de cortes del día en cuadre de caja chica — revisar lógica `getUsuariosSinCorteHoy`
- **Issue 7**: (ver doc de correcciones)
- **Issue 8**: El endpoint `/caja-general/dashboard?fecha=` no retorna el campo `diferencia` — falta agregarlo al servicio
- **Issue 9**: (ver doc de correcciones)
- **Issue 10**: El endpoint `/caja-general/dashboard?fecha=` no retorna correctamente la columna mencionada en el doc — falta en el servicio
- **Issue 13**: Al crear usuario con `SucursalID`, el campo se guarda como `null` en la DB. El POST recibe `SucursalID` pero el GET devuelve `null`. Revisar el servicio de users — el campo no se está mapeando correctamente al guardar.

### Front (issues 1,2,3,4,5,11 — no tocar el back para estos)
- **Issue 12**: Pendiente definir

---

## Convenciones que NO romper
- **Nunca** clasificar MetodoPago por ID hardcodeado — siempre por `NombreMetodo`
- **Nunca** permitir montos negativos en campos capturados
- **Nunca** eliminar/editar transacciones sin verificar jerarquía de bloqueos
- **Nunca** calcular SaldoEsperado incluyendo tarjeta o transferencia — solo efectivo
- **Siempre** registrar en `BitacoraEdiciones` o `BitacoraEliminaciones` antes de modificar/eliminar
- **Siempre** reactivar `InicioCaja` a `Activo` cuando se cancela o elimina un corte