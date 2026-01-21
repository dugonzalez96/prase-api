// src/caja-general/dto/cancel-caja-general.dto.ts

/**
 * DTO para cancelar un cuadre de caja general
 */
export class CancelCajaGeneralDto {
  /**
   * Usuario que realiza la cancelación (username o ID legible)
   */
  usuario: string;

  /**
   * Código de autorización generado por GET /caja-general/:id/codigo
   */
  codigo: string;

  /**
   * Motivo de la cancelación (obligatorio)
   */
  motivo: string;
}
