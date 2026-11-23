# Documentación del endpoint de personajes de Rick and Morty

Este proyecto documenta el endpoint `GET /character/{id}` de la [API de Rick and Morty](https://rickandmortyapi.com/documentation). Tiene tres partes que se pueden usar desde el navegador: una página de referencia con la documentación completa, una consola para probar el endpoint en vivo y un botón que genera un resumen de cada personaje con inteligencia artificial y comprueba automáticamente que ese resumen no se invente datos.

La documentación escrita de la Parte 1 está en el archivo `character-endpoint.md`, dentro de la carpeta `docs`. Ese mismo archivo es el que se muestra en la sección Referencia de la página, así que lo que se entrega y lo que se ve en el sitio son exactamente lo mismo.

## Decisiones técnicas

### Qué herramienta usé y por qué

Usé Next.js 15 con TypeScript. Lo elegí por tres motivos concretos de este proyecto, no por costumbre.

**El primero es la seguridad de la clave de la IA.** Si hubiera hecho la página con HTML puro o con React y Vite, la llamada al modelo de IA tendría que salir directamente desde el navegador, y eso significa que la clave quedaría visible para cualquiera que abra las herramientas de desarrollador. Next.js me permite tener, dentro del mismo proyecto, una ruta que se ejecuta solo en el servidor. Esa ruta es la que guarda la clave y habla con el modelo, y el navegador nunca la ve. Así no tuve que montar un backend aparte solo para esto.

**El segundo es la velocidad de carga.** Una documentación tiene que abrir rápido y poder encontrarse en buscadores. Con Next.js, la lista de personajes, la ficha de cada uno y la página de referencia se generan en el servidor, de modo que el navegador recibe el contenido ya listo en lugar de una página vacía que se llena después. Además, guardo en caché las respuestas de la API durante un día, lo cual tiene sentido porque la propia API indica que sus datos no cambian en meses.

**El tercero es tener una sola fuente de verdad.** La página de referencia lee el archivo Markdown de la Parte 1 directamente. Si corrijo algo en ese archivo, la página se actualiza sola, y nunca hay dos versiones distintas de la documentación.

Otras decisiones que tomé durante el desarrollo:

- **Solo uso componentes interactivos donde hace falta.** La consola de pruebas, el resumen con IA, la barra de búsqueda y los botones de copiar se ejecutan en el navegador. Todo lo demás se genera en el servidor, y así la página descarga menos JavaScript.
- **Los estilos los escribí yo con CSS Modules**, sin librerías de componentes. Cada componente tiene su propio archivo de estilos al lado, y los colores están definidos una sola vez como variables. El diseño es sencillo a propósito, con un tema claro y un solo color de acento, para que lo importante sean el contenido y los ejemplos de código.
- **Mantuve muy pocas dependencias.** La única librería extra importante es la que convierte el Markdown en HTML. El coloreado del JSON lo hice con una función propia de unas treinta líneas.
- **La consola llama a la API directamente desde el navegador.** La API lo permite, y así el tiempo de respuesta que aparece en pantalla es el real, sin intermediarios que lo alteren.
- **Valido el ID antes de enviarlo.** Al probar la API descubrí que, si le mandas un ID que no es un número, responde con un error 500 en lugar de un 400. Para que el usuario no vea un error de servidor confuso, la interfaz revisa el valor antes de enviarlo y explica qué está mal.
- **Cuidé la accesibilidad.** Usé HTML semántico, anuncio las respuestas a los lectores de pantalla, el foco del teclado siempre es visible, hay un atajo de teclado para buscar y las animaciones se desactivan si el sistema del usuario lo pide.

### Cómo integré la IA

El navegador solo envía el número del personaje. Es el servidor el que pide los datos oficiales a la API, de modo que nadie puede manipular la información que recibe el modelo. Después el servidor llama a Gemini, revisa la respuesta y la devuelve junto con el resultado de esa revisión.

Para el prompt partí del ejemplo del enunciado y le hice cuatro cambios. Primero, en vez de mandar el JSON completo, mando solo ocho datos del personaje, porque las URLs y las fechas no aportan nada a un resumen y el modelo podría mencionarlas sin sentido. Segundo, le doy reglas claras: solo puede usar los datos recibidos, cuando algo es desconocido debe presentarlo como un misterio en lugar de inventarlo, los nombres propios se copian tal cual y no puede escribir cifras que no estén en los datos. Sí le dejo libertad en el tono, que puede ser épico o con humor, porque la creatividad debe estar en el estilo y no en los hechos. Tercero, limito el formato a tres oraciones y setenta palabras como máximo. Cuarto, le pido la respuesta en formato estructurado, con el texto del resumen y una lista de los datos que dice haber usado, para poder auditarla.

Cada resumen pasa por cuatro comprobaciones automáticas que se muestran en pantalla junto al texto. La primera revisa que aparezca el nombre exacto del personaje. La segunda, que el estado vital sea coherente, por ejemplo que no diga que está muerto un personaje que sigue vivo. La tercera, que los datos que el modelo dice haber usado coincidan de verdad con los de la API. La cuarta, que no aparezcan números inventados, como edades o cantidades de episodios que no están en los datos. Estas comprobaciones tienen pruebas automáticas con resúmenes que contienen errores a propósito.

Si una comprobación falla, el resumen no se oculta, pero aparece en color ámbar con el aviso «Revisa este texto: la IA pudo haber inventado información», indica qué comprobación falló y el usuario puede pedir otro. Si no hay clave configurada, la aplicación genera un resumen de ejemplo a partir de los mismos datos, lo marca como respuesta simulada y lo pasa por las mismas comprobaciones. Así todo el flujo se puede evaluar aunque no se tenga clave.

### Decisiones de redacción de la Parte 1

**El orden de las secciones** sigue el camino de alguien que integra el endpoint por primera vez. Primero explico qué hace, luego qué tiene que enviar, después cómo se ve una llamada completa, qué recibe en la respuesta, qué errores pueden aparecer y, al final, algunas buenas prácticas. Es el mismo orden en el que una persona escribe el código, así que puede leer la documentación de arriba abajo mientras programa sin tener que saltar de un lado a otro.

**El tono** es directo y en segunda persona, con verbos como «consulta» o «verifica», frases cortas y voz activa. Quien lee una referencia técnica normalmente está en medio de una tarea y quiere la respuesta rápido. Por eso cada error tiene un apartado llamado «Cómo resolverlo» con pasos concretos: quien llega a esa parte tiene un problema y necesita saber qué hacer, no solo qué significa el código de error.

**El nivel de detalle** lo decidí pensando en lo que suele causar errores y no es evidente a simple vista. Por ejemplo, documenté que algunos campos pueden venir como texto vacío, que la fecha de creación es la del registro en la base de datos y no un dato de la serie, que un ID que no es número devuelve un error 500 y que el endpoint acepta varios IDs separados por comas. Son cosas que un desarrollador descubriría a base de prueba y error, y prefiero ahorrarle ese tiempo.

**Para el ejemplo de respuesta** elegí el personaje 826 en lugar del 1. Su respuesta es corta, porque aparece en un solo episodio, y además tiene todos los campos con valor. Así pude mostrar el JSON completo y exacto, sin recortarlo con puntos suspensivos, que es algo que suele dejar los ejemplos inválidos si alguien los copia.

**Verifiqué cada dato contra la API real** el 22 de noviembre de 2026. Para asegurarme de que las listas de valores posibles estaban completas, sumé los personajes de cada categoría. Los vivos, muertos y desconocidos dan 439, 287 y 100, y en total son los 826 personajes que tiene la API. Hice lo mismo con el género. También confirmé que las imágenes miden 300 por 300 píxeles y revisé las cabeceras de la respuesta con curl.

## Preguntas de criterio

### Pregunta 2. IA en el flujo de documentación

Mi criterio es usar la IA en las tareas donde ahorra mucho tiempo y donde un error es fácil de detectar, y poner siempre a una persona en los puntos donde un error sería caro o difícil de notar. En una documentación de API, el peor error no es una frase mal escrita, es un dato incorrecto que hace que el código de otro desarrollador deje de funcionar.

**Generar ejemplos de código.** A partir de un ejemplo en curl que ya sé que funciona, la IA puede escribir la misma llamada en JavaScript, Python u otros lenguajes en segundos. Aquí el control no tiene que ser solo humano: cada ejemplo generado se ejecuta automáticamente contra la API antes de publicarse, y si no funciona, no se publica. Después una persona revisa que el código siga las buenas prácticas de cada lenguaje.

**Hacer un primer borrador de las tablas de campos.** Si existe un spec OpenAPI, la IA puede convertirlo en un borrador con la descripción de cada campo. Esto ahorra mucho trabajo mecánico, pero aquí el control humano es obligatorio. Un technical writer tiene que revisar cada descripción y contrastarla con la API real, igual que hice yo en este proyecto. La IA tiende a escribir descripciones que suenan correctas pero son genéricas o, a veces, falsas.

**Traducir la documentación.** La IA traduce bien y rápido, sobre todo si se le da un glosario fijo para que los términos técnicos se traduzcan siempre igual o no se traduzcan. Aun así, pondría a un hablante nativo a revisar al menos las páginas más delicadas, como las de errores y las de autenticación, porque un matiz mal traducido ahí puede llevar a una integración incorrecta.

**Revisar el estilo.** La IA es útil para detectar voz pasiva, frases demasiado largas o un mismo concepto nombrado de dos formas distintas. El riesgo es bajo, porque solo hace sugerencias y la persona decide cuáles acepta.

**Donde no usaría la IA es en los valores exactos.** Los códigos de error, los tipos de datos, los límites y los nombres de los campos tienen que salir siempre del spec o de la propia API, nunca de un modelo. Es el mismo principio que apliqué en la Parte 3 de este proyecto: la IA puede aportar el estilo, pero los datos los aporta la fuente oficial, y hay una verificación automática que lo comprueba.

### Pregunta 4. Cambios que rompen compatibilidad

Un cambio que rompe compatibilidad es, por ejemplo, que el campo `status` dejara de ser un texto y pasara a ser un objeto. Cualquier integración que hoy lea ese campo como texto dejaría de funcionar de un día para otro. Mi objetivo sería que ningún desarrollador se entere del cambio porque su aplicación falló en producción. Lo haría en este orden.

**Primero, versionar en lugar de romper.** Publicaría el cambio en una versión nueva del endpoint y dejaría la versión actual funcionando igual que siempre. Así quien ya está integrado no se ve afectado de inmediato y puede migrar cuando le convenga dentro del plazo.

**Segundo, anunciarlo con antelación y por varios canales.** Escribiría una entrada en el changelog con la fecha del cambio, qué cambia exactamente, a quién afecta y un ejemplo de la respuesta antes y después. Añadiría un aviso visible en la página de referencia del endpoint afectado. Y enviaría un correo a los desarrolladores que realmente usan ese endpoint, a quienes se puede identificar por sus llamadas, para no molestar a quienes no les afecta.

**Tercero, avisar desde la propia API.** Añadiría las cabeceras `Deprecation` y `Sunset` en las respuestas de la versión antigua. De esta forma el aviso llega también a quien no lee correos ni el changelog, porque aparece en sus propios registros y herramientas de monitoreo.

**Cuarto, dar un periodo de deprecación razonable.** El plazo dependería del impacto del cambio. Para algo que afecta a muchas integraciones daría al menos seis meses, con un recordatorio a mitad del periodo y otro poco antes de apagar la versión antigua. Antes de apagarla revisaría cuántos desarrolladores siguen usándola y, si son muchos, los contactaría directamente.

**Quinto, facilitar la migración.** Publicaría una guía con el cambio mínimo de código necesario, con ejemplos en los lenguajes más usados. Si es posible, mantendría un tiempo en el que ambas versiones respondan a la vez, para que cada equipo pueda probar la nueva en paralelo antes de cambiarse del todo.

## Guía de implementación

### Requisitos

Necesitas Node.js 18.18 o superior para ejecutar la aplicación. Para correr las pruebas automáticas necesitas Node.js 22.18 o superior, porque esas versiones ejecutan TypeScript directamente.

### Cómo ejecutar el proyecto localmente

Abre una terminal en la carpeta del proyecto y sigue estos pasos.

1. Instala las dependencias.

   ```bash
   npm install
   ```

2. (Opcional) Crea un archivo `.env.local` en la raíz del proyecto con tu clave de Gemini, como se explica en [Cómo configurar la clave de la API de IA](#cómo-configurar-la-clave-de-la-api-de-ia). Sin él, la aplicación funciona igual con resúmenes simulados.

3. Inicia el servidor de desarrollo.

   ```bash
   npm.cmd run dev
   ```

4. Abre <http://localhost:3000> en tu navegador.

Si en Windows PowerShell muestra un error diciendo que la ejecución de scripts está deshabilitada, escribe `npm.cmd` en lugar de `npm`

Otros comandos útiles:

- `npm run build` genera la versión de producción.
- `npm start` sirve la versión de producción ya generada.
- `npm run typecheck` revisa que no haya errores de tipos en TypeScript.
- `npm test` ejecuta las pruebas del verificador de resúmenes.

### Cómo configurar la clave de la API de IA

El proyecto usa Gemini de Google, que tiene una capa gratuita.

1. Crea una clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey).
2. Crea un archivo llamado `.env.local` en la raíz del proyecto con este contenido, pegando tu clave después del signo igual.

   ```bash
   GEMINI_API_KEY=tu_clave
   GEMINI_MODEL=gemini-3.8-flash
   ```

   La segunda línea es opcional y sirve para elegir otro modelo de Gemini.

3. Detén el servidor y vuelve a iniciarlo con `npm run dev` para que tome la clave.

Si dejas la clave vacía, la aplicación funciona igual, pero usa el modo simulado para los resúmenes.

El archivo `.env.local` está incluido en `.gitignore`, así que tu clave nunca se sube al repositorio por accidente.

### Si trabajas en CodeSandbox

En CodeSandbox no hace falta crear el archivo `.env.local`. Abre la configuración del proyecto, entra en la sección de variables de entorno o Secrets y crea una variable llamada `GEMINI_API_KEY` con tu clave como valor. Después reinicia el servidor. Si despliegas en Vercel, el proceso es parecido: añade la variable en la configuración del proyecto y vuelve a desplegar.

### Qué mejoraría si tuviera más tiempo

- **Escribiría un spec OpenAPI del endpoint.** Así la tabla de campos se generaría automáticamente y podría validar en cada cambio que las respuestas reales coinciden con lo documentado.
- **Añadiría un reintento automático en la IA.** Cuando el verificador detecte que el resumen inventó algo, el servidor volvería a pedirlo una vez explicándole al modelo qué falló, y solo mostraría el aviso si vuelve a fallar.
- **Haría pruebas de extremo a extremo** con Playwright para la búsqueda, la consola de pruebas y la página de error 404, simulando a un usuario real.
- **Agregaría paginación y filtros** a la lista de personajes, y usaría la misma consola para documentar esos parámetros.
- **Ofrecería un modo oscuro y una versión en inglés** de la documentación.
- **Limitaría la cantidad de peticiones** a la ruta de la IA, para que nadie pueda gastar la cuota de la clave si el sitio se publica en internet.
