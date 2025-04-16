export class CreateEmpleadoDto {
    Nombre: string;
    Paterno: string;
    Materno?: string;
    FechaNacimiento: Date;
    SueldoQuincenal: number;
    PorcentajeComisiones: number;
    TipoEmpleadoID: number;
  }
  
  export class UpdateEmpleadoDto extends CreateEmpleadoDto {}
  