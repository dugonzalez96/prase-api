// dto/cuadrar-caja-general.dto.ts
export class CuadrarCajaGeneralDto {
  fecha: string;
  sucursalId?: number;
  usuarioCuadreId: number;
  observaciones?: string;
  folioCierre?: string;

  // Lo que captura físicamente el cajero:
  saldoReal?: number;                  // total que contó
  totalEfectivoCapturado?: number;
  totalTarjetaCapturado?: number;
  totalTransferenciaCapturado?: number;
}
