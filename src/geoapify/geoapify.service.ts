import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios'; // Importar desde @nestjs/axios
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GeoapifyService {
  private readonly apiKey = 'e542be0dbd4c469cb17997b2cccebcec'; // Reemplaza con tu API Key
  private readonly baseUrl = 'https://api.geoapify.com/v1/geocode/autocomplete';

  constructor(private httpService: HttpService) {}

  // Método para autocompletar lugares en México
  getAutocomplete(query: string): Observable<any> {
    const url = `${this.baseUrl}?text=${encodeURIComponent(query)}&filter=countrycode:mx&apiKey=${this.apiKey}`;
    return this.httpService.get(url).pipe(
      map((response) => response.data) // Transformar la respuesta
    );
  }
}
