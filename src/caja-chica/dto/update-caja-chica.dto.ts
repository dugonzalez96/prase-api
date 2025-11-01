// src/caja-chica/dto/update-caja-chica.dto.ts
import { EstatusCajaChica } from '../entities/caja-chica.entity';

export class UpdateCajaChicaDto {
  // Ajustes editables
  Observaciones?: string | null;

  // Si permites correcciones antes de cerrar:
  SaldoReal?: number;
  TotalEfectivoCapturado?: number;
  TotalTarjetaCapturado?: number;
  TotalTransferenciaCapturado?: number;

  // Si en tu flujo NO quieres permitir que cambien estatus aquí, elimínalo.
  Estatus?: EstatusCajaChica; // sugerencia: NO exponerlo aquí y usar PATCH /cancelar
}
