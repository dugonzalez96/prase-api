// src/caja-chica/dto/cancel-cuadre.dto.ts
export class CancelCuadreDto {
  usuario: string;        // quien cancela (username o id legible)
  codigo: string;         // código de autorización generado por GET /:id/codigo
  motivo?: string;        // opcional
}
