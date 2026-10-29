# Gravitación

Una web que explica la ley de la gravitación universal a un adulto sin formación en física y que enseña seis órbitas periódicas del problema de los tres cuerpos. La he hecho como prueba técnica.

- **Web:** https://gravitacion.vercel.app
- **Código:** https://github.com/thonygrz/gravitacion

## Qué hay

- **`/aprende` (Parte A).** Cuatro lecciones cortas: todo atrae a todo, la fórmula, caer sin llegar nunca y qué pasa con tres cuerpos. Incluye un laboratorio de fuerza (masas y distancia, con la fórmula y sus números), un lanzador de planetas (choca, orbita o escapa según la velocidad) y cuatro preguntas de comprobación con su explicación.
- **El tutor**, en la misma página: un modelo de lenguaje (Claude Haiku 5.5) que explica, corrige las respuestas falladas y se adapta al nivel que muestran esas respuestas. Además puede mover el laboratorio y el lanzador para enseñar lo que cuenta, y enlazar órbitas de la galería. Sin clave del modelo, el panel lo avisa y las preguntas se siguen corrigiendo con su explicación fija.
- **`/galeria` (Parte B).** Lagrange, Figura de ocho, Butterfly I, Goggles, Moth I y Yin-Yang I, con su dibujo y su periodo, ordenables. Al volver de una órbita, la galería conserva el orden, el scroll y el foco.
- **`/galeria/<órbita>`.** Cada órbita tiene su propia dirección, que se puede compartir, por ejemplo [/galeria/figura-de-ocho](https://gravitacion.vercel.app/galeria/figura-de-ocho). Trae la simulación animada con controles (reproducir y pausar, reiniciar, velocidad, posición en el periodo y estelas), sus datos y las condiciones iniciales con su fuente.

## Cómo arrancarlo

Hace falta Node 22 (lo fija `engines` en `package.json`) y npm.

```bash
git clone https://github.com/thonygrz/gravitacion.git
cd gravitacion
npm ci
cp .env.example .env.local   # opcional: pon ahí tu ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Para servir el build de producción en local: `npm run build` y después `npm start`.

### Variables de entorno

| Variable | Para qué | ¿Obligatoria? |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic para el tutor. Solo la lee el servidor. | No. Sin ella, el tutor queda en modo reducido. |
| `TUTOR_MODEL` | Modelo del tutor. | No. Por defecto, `claude-haiku-5-5`. |

En local van en `.env.local`, que no se sube al repositorio (la plantilla es `.env.example`). En Vercel, en las variables del proyecto, como tipo Secret y solo en Production. En la cuenta de Anthropic, la clave pertenece a un espacio de trabajo propio con límite de gasto mensual: la web es pública y ese límite es el tope real del coste del tutor.

## Tests

- **`npm test`:** Vitest, 118 tests. Cubren la física (gravedad, integradores, cierre de cada órbita frente a su periodo publicado), el trazado de las órbitas, el lanzador y el tutor. El tutor se prueba con el modelo simulado del AI SDK, que permite comprobar qué recibe el modelo y que cada petición repite la anterior sin cambiarla.
- **`npm run test:e2e`:** Playwright, 128 tests, en el Chrome instalado a 1280, 768 y 375 px (táctil) y en el Firefox de Playwright a 1280. Construye y sirve el build de producción en el puerto 3100 sin clave del modelo; donde un test necesita el tutor, el propio navegador contesta con respuestas grabadas. La primera vez hay que instalar ese Firefox con `npx playwright install firefox`.
- **`npm run typecheck`** y **`npm run lint`**.

Ningún test llama al modelo. Cada test nuevo lo he visto fallar con una mutación del código que protege.

## Cómo está hecho

Next.js 16 (App Router con Cache Components), React 19, TypeScript estricto, Tailwind CSS 4 y, para el tutor, el AI SDK con su proveedor de Anthropic y zod. Se despliega en Vercel desde `main`.

```
src/
  lib/physics/   gravedad, integradores (Dormand-Prince 5(4) y Yoshida 4), lanzamiento: TypeScript puro, sin React
  lib/orbits/    las seis órbitas con su fuente, trayectorias y dibujos
  lib/plot/      encuadre y trazado SVG
  lib/learn/     preguntas, nivel, límites del laboratorio y G del Sistema Internacional
  lib/tutor/     instrucciones, herramientas, validación y manejador de /api/tutor
  app/           páginas, /api/tutor y /api/version (el commit desplegado)
  components/    cabecera, galería, reproductor y las piezas de /aprende
e2e/             tests de navegador
docs/            decisiones técnicas
```

## Decisiones

El detalle de cada una, con su razón, su coste y la alternativa descartada, está en [docs/decisiones.md](docs/decisiones.md). En resumen:

- **Dos integradores.** Dormand-Prince 5(4) con paso adaptativo para el catálogo: los acercamientos de Butterfly I, Goggles y Yin-Yang I pedirían un paso fijo diminuto. Yoshida de cuarto orden para lo que se simula en vivo, porque es simpléctico y su error de energía no crece.
- **Un periodo precalculado.** La simulación del detalle integra un periodo con 6000 muestras en un Web Worker y lo repite en un canvas sobre el dibujo SVG de la órbita. Varias de estas órbitas son inestables y una simulación sin fin acabaría deshaciéndolas. El bucle usa el periodo medido con este motor, que se aleja del publicado como mucho 2e-3.
- **La galería se calcula en el build.** Sus dibujos son SVG estáticos y se ven sin JavaScript. Para conservar su estado al volver se combinan Activity de React y un proveedor en el layout de `/galeria`; solo con Activity se perdía desde el tercer detalle seguido (medido). Una órbita que no existe da un 404 de verdad.
- **Controles nativos.** Son del navegador, así que teclado y lectores de pantalla funcionan sin código propio. Con `prefers-reduced-motion`, nada se anima solo.
- **G = 1 en el laboratorio.** Lo que se aprende de la ley son sus proporciones; el valor real de G aparece en la lección con su fuente.
- **El tutor.** Las tres herramientas que operan la página se ejecutan en el navegador y devuelven al modelo lo que calcula la página, así que el modelo no inventa números. La conversación es de solo añadir: las instrucciones no cambian nunca y el estado de la página viaja con cada mensaje del usuario, porque Haiku 5.5 rechaza su propio razonamiento anterior si se reenvía después de cambiar el historial. Todo lo que llega del navegador se valida con zod y con límites de tamaño.
- **Un fallo encontrado al medir.** Al sacar capturas, una respuesta vacía tras una herramienta hacía que el panel reenviara la conversación sin fin: 22 peticiones en 3 segundos, cada una de ellas una llamada de pago con el modelo real. El panel lo comprueba ahora por su cuenta y un test lo fija.

## Fuentes

- **Butterfly I, Goggles, Moth I y Yin-Yang I:** M. Šuvakov y V. Dmitrašinović, *Three Classes of Newtonian Three-Body Planar Periodic Orbits*, Phys. Rev. Lett. 110, 114301 (2013), tabla I ([arXiv:1303.0181](https://arxiv.org/abs/1303.0181)).
- **Figura de ocho:** M. Šuvakov, *Numerical Search for Periodic Solutions in the Vicinity of the Figure-Eight Orbit: Slaloming around Singularities on the Shape Sphere* ([arXiv:1312.7002](https://arxiv.org/abs/1312.7002)), tabla I, órbita M8 (de Moore, 1993). Su periodo se contrasta con las condiciones de Simó que publican A. Chenciner y R. Montgomery, Annals of Mathematics 152 (2000).
- **Lagrange:** el triángulo equilátero en rotación (Lagrange, 1772), con las condiciones derivadas a mano.
- **Constante de gravitación:** valor recomendado por CODATA en 2022, publicado por el [NIST](https://physics.nist.gov/cgi-bin/cuu/Value?bg).

## Accesibilidad y dispositivos

- Todo se usa con teclado (Tab, Enter, Espacio y flechas), con foco visible y un enlace para saltar al contenido.
- El contraste está medido con la fórmula de WCAG: el texto, 16,95:1 sobre el fondo.
- Con `prefers-reduced-motion` la órbita espera en pausa y el lanzador dibuja el camino entero de una vez.
- Probado a 375, 768 y 1280 px, sin scroll horizontal.

## Límites

- La simulación del detalle repite un periodo calculado de antemano, no integra sin fin: varias órbitas son inestables.
- El estado de la galería y de `/aprende` se pierde al recargar la página, como permite el enunciado.
- Las conversaciones con el tutor no se guardan. Si se agota el presupuesto del mes, el tutor lo dice y las preguntas se siguen corrigiendo con su explicación fija.
- No está la mejora de buscar órbitas propias.
- No he probado la web en un móvil real, solo en Chrome emulando uno a 375 px.
- No hay imagen de Docker: la entrega es el repositorio y la web desplegada.

## Cómo he usado la IA

He hecho la prueba con Claude Code (Claude Opus 5.5) como asistente de programación. Yo he decidido el alcance y el orden del trabajo y he revisado y aprobado cada cambio antes de subirlo; la IA ha propuesto y escrito el código, los tests y esta documentación. Para poder defender cada decisión, trabajamos con unas reglas:

- Nada se afirma sin medirlo antes; las mediciones están en [docs/decisiones.md](docs/decisiones.md).
- Ninguna cifra de la literatura de memoria: las condiciones iniciales, los periodos y G salen de las fuentes citadas, leídas para la ocasión.
- Cada test nuevo se ve fallar con una mutación del código que protege.
- Nada se da por desplegado hasta que `/api/version` sirve el commit nuevo.
- Ninguna llamada real al modelo sin mi permiso; los tests usan uno simulado.

Dentro de la web, la IA es el tutor de `/aprende`.
