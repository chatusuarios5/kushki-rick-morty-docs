# Consultar un personaje

`GET https://rickandmortyapi.com/api/character/{id}`

Devuelve la información completa de un personaje de Rick and Morty a partir de su identificador único.
Úsalo cuando ya conoces el ID del personaje; por ejemplo, para mostrar su ficha de detalle después de listarlo.

| Propiedad | Valor |
| --- | --- |
| URL base | `https://rickandmortyapi.com/api` |
| Método | `GET` |
| Autenticación | No requiere. |
| Formato de respuesta | JSON (`Content-Type: application/json; charset=utf-8`) |
| CORS | Permitido desde cualquier origen (`Access-Control-Allow-Origin: *`), así que puedes llamarlo desde el navegador. |

## Parámetros

| Nombre | Ubicación | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| `id` | Ruta (path) | Entero | Sí | Identificador único del personaje. Es un entero mayor o igual que 1. Para saber cuántos personajes existen, consulta `info.count` en `GET /character`; al 22 de noviembre de 2026 el valor es 826. |

> **Nota:** El parámetro `id` también acepta varios IDs separados por comas, como `1,2,3`. En ese caso, la respuesta es un arreglo de personajes en lugar de un objeto. Esta página documenta la consulta de un solo personaje.

## Ejemplo de solicitud

```bash
curl https://rickandmortyapi.com/api/character/826
```

## Respuesta exitosa (200)

La API devuelve un objeto con los datos del personaje.

```json
{
  "id": 826,
  "name": "Butter Robot",
  "status": "Alive",
  "species": "Robot",
  "type": "Passing Butter Robot",
  "gender": "Genderless",
  "origin": {
    "name": "Earth (Replacement Dimension)",
    "url": "https://rickandmortyapi.com/api/location/20"
  },
  "location": {
    "name": "Earth (Replacement Dimension)",
    "url": "https://rickandmortyapi.com/api/location/20"
  },
  "image": "https://rickandmortyapi.com/api/character/avatar/826.jpeg",
  "episode": [
    "https://rickandmortyapi.com/api/episode/9"
  ],
  "url": "https://rickandmortyapi.com/api/character/826",
  "created": "2021-11-02T17:24:37.458Z"
}
```

### Campos de la respuesta

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | Entero | Identificador único del personaje. |
| `name` | Cadena | Nombre del personaje. |
| `status` | Cadena | Estado vital. Valores posibles: `Alive`, `Dead` o `unknown`. |
| `species` | Cadena | Especie del personaje; por ejemplo, `Human`, `Alien` o `Robot`. |
| `type` | Cadena | Subespecie o variante. Es una cadena vacía (`""`) cuando no aplica. |
| `gender` | Cadena | Género. Valores posibles: `Female`, `Male`, `Genderless` o `unknown`. |
| `origin` | Objeto | Lugar de origen del personaje. |
| `origin.name` | Cadena | Nombre del lugar de origen. Es `unknown` si no se conoce. |
| `origin.url` | Cadena | URL del endpoint de la ubicación de origen. Es una cadena vacía (`""`) si no se conoce. |
| `location` | Objeto | Última ubicación conocida del personaje. |
| `location.name` | Cadena | Nombre de la última ubicación conocida. Es `unknown` si no se conoce. |
| `location.url` | Cadena | URL del endpoint de la última ubicación conocida. Es una cadena vacía (`""`) si no se conoce. |
| `image` | Cadena | URL de la imagen del personaje, en formato JPEG de 300 × 300 px. |
| `episode` | Arreglo de cadenas | URLs de los episodios en los que aparece el personaje. Usa la longitud del arreglo para saber en cuántos episodios aparece. |
| `url` | Cadena | URL del propio endpoint del personaje. |
| `created` | Cadena (ISO 8601) | Fecha y hora en que se creó el registro en la base de datos de la API. No es una fecha del universo de la serie. |

## Errores

Los errores devuelven un objeto JSON con un único campo, `error`, que describe el problema en inglés.

### 404 Not Found

El personaje no existe. Ocurre cuando el `id` es un número que no corresponde a ningún personaje, como `9999`, `0`, un número negativo o un decimal.

```bash
curl https://rickandmortyapi.com/api/character/9999
```

```json
{
  "error": "Character not found"
}
```

**Cómo resolverlo:**

1. Verifica que el `id` sea un entero entre 1 y el valor de `info.count` de `GET /character`.
2. Si no conoces el ID, búscalo por nombre con `GET /character/?name={nombre}` y toma el campo `id` del resultado.

### 500 Internal Server Error

La API responde con un 500, y no con un 400, cuando el `id` no es numérico; por ejemplo, `abc`.

```json
{
  "error": "Hey! you must provide an id"
}
```

**Cómo resolverlo:** valida en tu código que el `id` sea un entero positivo antes de enviar la solicitud. No reintentes la misma petición: el error se repetirá mientras el `id` no sea válido.

## Buenas prácticas

- **Guarda las respuestas en caché.** La API envía `Cache-Control: public, max-age=7776000, immutable` (90 días), porque los datos de un personaje casi nunca cambian.
- **Pide varios personajes en una sola solicitud.** Si necesitas los datos de varios IDs, usa `GET /character/1,2,3` en lugar de hacer una petición por cada uno.
- **No construyas la URL de la imagen a mano.** Usa el valor del campo `image`.
