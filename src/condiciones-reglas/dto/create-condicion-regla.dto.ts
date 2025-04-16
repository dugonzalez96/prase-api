// create-condicion-regla.dto.ts
export default class CreateCondicionReglaDto {
  Campo: string;
  Operador: '>' | '<' | '=' | '>=' | '<=' | 'IN';
  Valor: string;
  CodigoPostal: string;
  ReglaID: number;
}
