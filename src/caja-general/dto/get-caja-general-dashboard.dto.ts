export class GetCajaGeneralDashboardDto {
  // YYYY-MM-DD desde el frontend (datepicker)
  fecha: string;

  // opcional, null = todas las sucursales
  sucursalId?: number;
}
