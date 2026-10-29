# Decisiones técnicas

Cada decisión con su razón, su coste y la alternativa descartada. El README las resume.

## Integración del catálogo: Dormand-Prince 5(4) con paso adaptativo

- **Qué:** las seis órbitas se integran con Dormand-Prince 5(4) y control del error en cada paso (`rtol` 1e-10, `atol` 1e-12), el mismo esquema que `RK45` de SciPy.
- **Razón:** Butterfly I, Goggles y Yin-Yang I tienen acercamientos muy estrechos entre cuerpos. Con paso fijo haría falta un paso diminuto durante todo el periodo: con `dt = 1e-3` la energía se dispara y con `dt = 2.5e-4` Butterfly I aún pierde un 0.6 % (medido el 27/10/2026). El paso adaptativo solo se reduce en esos acercamientos: un periodo con 2000 muestras se calcula en 25 a 118 ms y la energía se conserva con un error relativo de 1e-8 o menos. Los autores de las condiciones iniciales usaron un método de la misma familia (Runge-Kutta-Fehlberg 4(5)).
- **Coste:** no es simpléctico, así que en simulaciones muy largas la energía derivaría; aquí solo se integra un periodo.
- **Alternativa descartada:** RK4 o Yoshida con paso fijo.

## Yoshida de cuarto orden para las simulaciones en vivo

- **Razón:** es simpléctico: su error de energía oscila sin acumularse, que es lo que necesita una simulación que corre sin fin. En la figura de ocho, durante 100 periodos con `dt = 0.01`, el error máximo es 2e-8 con Yoshida y 2.6e-7 con RK4, que además va creciendo. Yoshida hace 3 evaluaciones de fuerza por paso y RK4, 4.
- **Alternativa descartada:** RK4, que se midió en las mismas condiciones y se retiró del código.

## Condiciones iniciales y periodos

- **Fuentes:** Butterfly I, Goggles, Moth I y Yin-Yang I salen de Šuvakov y Dmitrašinović, Phys. Rev. Lett. 110, 114301 (2013), tabla I (para Yin-Yang I, la fila II.C.2a). La figura de ocho, de Šuvakov, arXiv:1312.7002, tabla I (órbita M8 de Moore, con 16 decimales). Lagrange se deriva a mano: triángulo equilátero de radio 1 que gira con v = 3^(-1/4).
- **Dos periodos:** las tablas dan el periodo con cuatro decimales, y no coincide del todo con el instante en que la órbita vuelve a su estado inicial: en la figura de ocho, la tabla dice 6.3250 y la órbita se cierra en 6.325897. El catálogo guarda los dos. La animación usa el medido para que el bucle no dé un salto, y los tests comprueban que el sistema vuelve a su estado inicial en ese instante y que no se aleja más de 2e-3 del publicado.
- **Contraste independiente:** Chenciner y Montgomery (Annals of Mathematics 152, 2000, figura 1) publican las condiciones de Simó para la figura de ocho con T = 6.32591398; integradas con este motor, se cierran en 6.32591401. La diferencia con el 6.325897 de las condiciones de Šuvakov viene de su energía, 1.9e-6 distinta en términos relativos: como el periodo escala con |E|^(-3/2), eso predice 1.8e-5 de diferencia, y se miden 1.7e-5.
- **Verificación:** la distancia en el espacio de fases al volver (la "proximidad de retorno" de los autores) queda por debajo de 1e-9 en Lagrange y entre 8e-7 y 2.3e-4 en el resto, según los decimales publicados. La energía se conserva en todas.

## Precalcular un periodo y repetirlo

- **Razón:** varias de estas órbitas son inestables, también la de Lagrange: en una simulación viva, el error numérico acaba deshaciéndolas. Precalcular un periodo da una reproducción estable y hace triviales la velocidad y la barra de posición.
- **Coste:** no es una simulación infinita; se explica en los límites del README.

## Galería: dibujos SVG calculados en el build

- **Qué:** cada tarjeta muestra la trayectoria de un periodo como SVG estático. Al prerenderizar la página, el servidor integra la órbita, simplifica cada trayectoria con Ramer-Douglas-Peucker (tolerancia de 1/2000 del ancho) y escribe el trazado con tres decimales. Se marca dónde empieza cada cuerpo: en Lagrange y en la figura de ocho las tres trayectorias son la misma curva, y sin las marcas solo se vería una. Medido: en esas dos órbitas cada cuerpo repite el camino del primero con un tercio de periodo de desfase (error de 1e-13 y 4e-5); en las otras cuatro, no.
- **Razón:** la galería se ve sin JavaScript, se sirve como HTML estático y los dibujos son nítidos a cualquier tamaño.
- **Coste:** unos 42 KB de trazados sin comprimir en el HTML de la galería (medido) y menos de un segundo de build para las seis órbitas.
- **Alternativa descartada:** dibujar las miniaturas en canvas en el navegador, que obliga a integrar las seis órbitas antes de enseñar nada.

## Detalle: 6000 muestras calculadas en un Web Worker

- **Qué:** el reproductor integra un periodo con 6000 muestras en un Web Worker y lo anima en un canvas encima del SVG estático de la órbita, con la misma caja de vista (`fitViewBox` encaja igual que el `preserveAspectRatio` por defecto del SVG). Mientras calcula se ve el SVG.
- **Razón:** en los acercamientos de Butterfly I, Goggles y Yin-Yang I, dos muestras consecutivas quedan hasta 14 px separadas en un lienzo de 800 px con 2000 muestras, y unos 6 px con 6000. Integrar 6000 muestras cuesta de 70 a 100 ms por órbita en escritorio, y en el worker ese tiempo no bloquea la página. Desde que empieza la navegación hasta que la órbita se mueve pasan de 320 a 415 ms de mediana, en Chrome y en Firefox de escritorio (medido el 28/10/2026).
- **Coste:** un fichero más y comprobar lo que cruza `postMessage`. En un móvil real no está medido.
- **Alternativa descartada:** calcular en el hilo principal, o enviar las muestras desde el build: 6000 muestras × 3 cuerpos × 2 coordenadas en `Float32` son 144 KB por órbita, 192 KB en base64.

## Controles nativos

- **Qué:** reproducir y pausar, reiniciar, estelas, velocidad y posición son botones, una casilla, radios y un `input type="range"` del navegador. La posición avanza en pasos de medio por ciento del periodo y anuncia el tiempo con `aria-valuetext`. Los ids y los nombres de los grupos de radios salen de `useId`.
- **Razón:** el teclado (Tab, Espacio, Enter y flechas) y los lectores de pantalla funcionan sin código propio. Con Activity las páginas ocultas siguen en el DOM: con ids fijos, dos detalles visitados repetirían ids, y dos grupos de radios con el mismo nombre forman un solo grupo para el navegador.
- **Coste:** menos libertad de diseño que con controles hechos a mano.
- **Alternativa descartada:** atajos de teclado propios sobre el lienzo.
- **Movimiento reducido:** con `prefers-reduced-motion`, la animación espera en pausa, con la órbita completa dibujada, hasta que se pulsa reproducir.

## Estado al volver a la galería

- **Qué:** el orden elegido, el scroll y el foco se conservan al volver de un detalle, por el enlace "Volver a la galería", por la cabecera o con el botón atrás. Cache Components oculta la galería con `<Activity>` en lugar de desmontarla; además, el orden y la posición viven en un proveedor del layout de `/galeria`, que no se desmonta mientras se navega entre órbitas.
- **Razón:** Activity conserva solo 3 rutas, contando la visible. Medido: con uno o dos detalles seguidos la galería vuelve intacta; desde el tercero vuelve a su estado inicial, y el detalle invita a saltar entre órbitas ("Otras órbitas"). El scroll de la ventana lo comparte la página que sustituye a la galería, y el foco se pierde al ocultarse el elemento enfocado: los dos se reponen a mano al volver a mostrarse, y los enlaces a la galería usan `scroll={false}` para que Next no la lleve arriba.
- **Coste:** un proveedor de contexto y un efecto. El estado no sobrevive a una recarga, que el enunciado no pide.
- **Alternativa descartada:** solo Activity, que pierde el estado desde el tercer detalle seguido, o el orden en la URL, que obliga a renderizar en el cliente la parte que lo lee.

## 404 real para órbitas que no existen

- **Qué:** la página de detalle exporta `ensureStatic = "navigation"`.
- **Razón:** con Cache Components y prefetch parcial, Next 16.4 sirve al instante un armazón para un slug que no está en `generateStaticParams`, y el `notFound()` llegaba con la respuesta ya empezada: `/galeria/no-existe` devolvía 200 con la página de no encontrado (medido). Con `"navigation"` la ruta completa tiene que ser estática y esa primera petición espera al render: ahora responde 404, y el test de navegador falla sin la línea. Además impide que el detalle llegue a depender de datos de la petición.
- **Coste:** ninguno medido: las seis páginas ya eran estáticas.
- **Alternativa descartada:** `dynamicParams = false`, que Cache Components no admite, o un `proxy.ts` que filtre los slugs.

## Paleta y contraste

- **Qué:** fondo #060912, texto #e8edf7, texto secundario #a3aec6 y acento #f5b83d. Los cuerpos son naranja (#e69f00), azul claro (#56b4e9) y verde (#009e73).
- **Razón:** contraste medido con la fórmula de WCAG 2.x: texto 16,95:1, secundario 8,93:1 (8,32:1 sobre las tarjetas), acento 11,18:1 y texto sobre el acento 11,18:1. Los cuerpos, 8,83, 8,62 y 5,82:1 sobre el fondo, con tonos muy separados entre sí.
- **Coste:** los bordes de las tarjetas son decorativos (1,34:1): cada tarjeta se identifica por su título y el foco se marca con el acento.

## Parte A: cuatro lecciones cortas con dos laboratorios

- **Qué:** `/aprende` explica la ley en cuatro pasos (todo atrae a todo, la fórmula, las órbitas y el paso a tres cuerpos), con un laboratorio de fuerza, un lanzador de planetas y cuatro preguntas de comprobación con su explicación.
- **Razón:** para un adulto sin formación en física, lo esencial de la ley son sus proporciones: el doble de masa, el doble de fuerza; el doble de distancia, la cuarta parte. Por eso el laboratorio usa G = 1, escribe la fuerza en unidades de G con los números de cada momento y dice cuánto ha cambiado respecto al valor anterior ("4 veces menor"). El valor real de G aparece en la lección con su fuente (CODATA 2022, publicado por el NIST), y el ejemplo de dos personas de 70 kg a un metro lo calcula el propio código con ese valor.
- **Coste:** las unidades del laboratorio no son las del mundo real; la lección lo dice.
- **Alternativa descartada:** unidades del Sistema Internacional en el laboratorio: con masas de 1 a 10 kg y distancias de 1 a 10 m, las fuerzas irían de 7e-13 a 7e-9 N, imposibles de leer y comparar a simple vista.

## Lanzador: el resultado se calcula y el movimiento se simula

- **Qué:** el planeta sale de lado a distancia 1 de una estrella de masa 1. Si choca, orbita o escapa lo dice `launchOutcome` a partir de la energía y del momento angular: escapa con energía no negativa; si no, se mueve en una elipse entre el punto de lanzamiento y el otro ápside, r·v²/(2GM/r − v²), y choca si ese ápside cae dentro de la estrella. El movimiento se integra en vivo con Yoshida, el integrador simpléctico de las simulaciones vivas.
- **Razón:** el texto del resultado cambia al mover la velocidad, sin esperar a la animación, y los tests lo contrastan con la integración numérica: el acercamiento máximo y el periodo de Kepler coinciden hasta el quinto decimal.
- **Coste:** la estrella se trata como casi fija (el planeta pesa 1e-9), que es lo que supone la fórmula.
- **Movimiento reducido:** el lanzamiento se dibuja entero de una vez (una vuelta, o el camino hasta chocar o salir de la vista) en lugar de animarse.

## Estado compartido de la página Aprende

- **Qué:** las masas, la distancia, la velocidad de lanzamiento y las primeras respuestas viven en un proveedor de la página, no dentro de cada componente. Todo valor se ajusta a los límites y a los pasos de su deslizador, también los que llegan del tutor (un 3,3 de distancia queda en 3,5), y el nivel (inicial, intermedio o avanzado) sale de la primera respuesta a cada pregunta.
- **Razón:** el tutor tiene que poder leer ese estado y moverlo (las herramientas que operan la aplicación), y el nivel tiene que viajar con cada mensaje.
- **Coste:** un contexto más; cualquier cambio vuelve a pintar los dos laboratorios, que son pequeños.

## Tutor: Claude Haiku 5.5 con el AI SDK

- **Qué:** el panel del tutor de `/aprende` llama a `POST /api/tutor`, que valida la conversación, llama a Claude Haiku 5.5 (`claude-haiku-5-5`, cambiable con `TUTOR_MODEL`) con el AI SDK y su proveedor de Anthropic, y devuelve la respuesta en streaming. Esfuerzo bajo y como mucho 2048 tokens de salida.
- **Razón:** el AI SDK trae `useChat` (streaming, estado de la conversación y herramientas que se ejecutan en el navegador) y el protocolo entre cliente y servidor, que con el SDK oficial de Anthropic habría que escribir a mano. Haiku 5.5 es el modelo rápido y barato de la familia actual: 0,10 $ por millón de tokens de entrada y 0,50 $ por millón de salida en prompts de hasta 100 000 tokens. El esfuerzo bajo es el nivel pensado para conversación y adelanta el principio de la respuesta.
- **Coste:** una capa más entre el código y la API: las novedades de Anthropic llegan al AI SDK con retraso y algún comportamiento depende de él (ver "Reenvío automático tras una herramienta"). Haiku razona menos que Sonnet u Opus.
- **Medido con 13 llamadas reales** en local el 29/10/2026, desde el panel. Las respuestas salieron en español, breves, en texto plano y adaptadas al nivel: sin fórmulas en el inicial, con la energía en el avanzado. Usaron bien las tres herramientas, corrigieron una pregunta fallada y rechazaron lo que no era del tema y un intento de saltarse las reglas. Hubo un dato inventado: que al 140 % el planeta ya escapaba, cuando la página dice que aún orbita. Se corrigió dando al modelo los umbrales del lanzador que calcula la página, con un test que los compara, y la misma pregunta salió bien. Cada llamada leyó de 2312 a 3663 tokens, 2025 de ellos de la caché desde la segunda de cada sesión, y escribió de 89 a 1084. En total, unos 0,004 $, con respuestas completas en 1,4 a 6,8 s.
- **Alternativa descartada:** `@anthropic-ai/sdk`, con el bucle de herramientas y el streaming hacia el navegador escritos a mano.

## Herramientas que operan la página

- **Qué:** tres herramientas sin `execute` en el servidor: `setLab` (masas y distancia del laboratorio), `setLaunchSpeed` (velocidad del lanzador) y `showOrbit` (enlace a una órbita de la galería). El navegador las ejecuta sobre el mismo estado que mueven los deslizadores y devuelve al modelo los valores aplicados y lo que calcula la página: la fuerza antes y después, o si el planeta choca, orbita o escapa.
- **Razón:** el modelo enseña en la página en lugar de solo contarlo, y explica con los números de la física de la página en vez de inventarlos.
- **Coste:** cada herramienta es una vuelta más al servidor y otra llamada al modelo. El panel deja de reenviar tras 4 llamadas seguidas y el servidor rechaza una quinta sin un mensaje del usuario entre medias.

## Conversación de solo añadir

- **Qué:** las instrucciones y las herramientas son idénticas en todas las peticiones. Lo que cambia (respuestas a las preguntas, laboratorio y lanzador) viaja como metadatos del mensaje del usuario en el que se escribió, y el servidor lo pone en un mensaje de sistema justo después de ese mensaje. Cada petición repite las anteriores tal cual y solo añade al final; un test lo comprueba con el modelo simulado.
- **Razón:** con Claude Haiku 5.5, reenviar un bloque de pensamiento después de cambiar el `system`, las herramientas o mensajes anteriores devuelve un 400 (por defecto, en las cuentas creadas desde el 31/08/2026). Unas instrucciones fijas, además, se pueden cachear.
- **Coste:** el modelo ve la página como estaba al escribir cada mensaje, no como está ahora; cuando una herramienta cambia algo, su resultado trae los valores nuevos.
- **Alternativa descartada:** el estado actual dentro del `system`, que cambiaría en cada mensaje.

## Nivel del usuario

- **Qué:** el servidor calcula el nivel a partir de la primera respuesta a cada pregunta de comprobación y se lo da al modelo con cada mensaje, junto con qué preguntas acertó y cuáles falló. Tras un fallo, un botón le manda al tutor la pregunta y la respuesta elegida.
- **Razón:** adaptarse a lo que el usuario demuestra saber (una de las mejoras que propone el enunciado) con un dato que el usuario da sin esfuerzo, y corregir justo donde se equivocó.
- **Coste:** cuatro preguntas son poca señal; las instrucciones piden adaptarse también a lo que el usuario muestra en la conversación.

## Validación y límites de `/api/tutor`

- **Qué:** se valida todo lo que llega del navegador: el cuerpo tiene que ser JSON (si no, 415); los mensajes, con el esquema de la UI del AI SDK; los metadatos, con zod y dentro de los límites de los deslizadores; las salidas de las herramientas, con su esquema. Además, ningún mensaje de sistema del cliente, como mucho 40 mensajes, 600 caracteres por mensaje del usuario y 4 llamadas a herramientas seguidas. La clave solo se lee en el servidor, en cada petición, y `GET /api/tutor` dice si la hay.
- **Razón:** la URL es pública y cada petición gasta del presupuesto. Los límites acotan lo que una petición puede hacer leer al modelo. Exigir JSON obliga al navegador a preguntar antes (preflight) cuando la petición viene de otra web, y la ruta no contesta a esa pregunta, así que otras webs no pueden gastar el presupuesto del tutor.
- **Coste:** una conversación muy larga hay que empezarla de nuevo; el panel lo dice.
- **El tope de verdad** es el límite de gasto del espacio de trabajo en la consola de Anthropic. Si se alcanza, el tutor lo dice y las preguntas se siguen corrigiendo con su explicación fija.

## Reenvío automático tras una herramienta

- **Qué:** tras ejecutar una herramienta, el panel reenvía la conversación solo si el último mensaje ha cambiado desde el reenvío anterior.
- **Razón:** medido al sacar capturas el 29/10/2026. El cliente del AI SDK no publica un paso que llega vacío, de modo que tras una herramienta y una respuesta sin contenido la conversación parecía igual y se reenviaba sin fin: 22 peticiones en 3 segundos, cada una de ellas una llamada de pago con el modelo real. Con el servidor real el paso sí se publica, porque el final de la respuesta lleva los tokens usados, pero eso depende de un detalle interno; la comprobación propia no. Un test de navegador lo fija.
- **Coste:** ninguno visible: tras una respuesta vacía, la conversación espera al usuario.

## Modo reducido sin clave

- **Qué:** sin `ANTHROPIC_API_KEY`, `GET /api/tutor` dice que no hay tutor; el panel lo avisa antes de que nadie escriba y no muestra el formulario. Las preguntas de comprobación siguen corrigiéndose con su explicación fija, sin el botón al tutor.
- **Razón:** la web funciona entera sin clave, y nadie escribe una pregunta para descubrir después que no hay quien la conteste.

## Tests del tutor sin llamadas al modelo

- **Qué:** los tests unitarios usan el modelo simulado del AI SDK (`MockLanguageModelV4`) y comprueban qué recibe. Los de navegador arrancan el servidor con `ANTHROPIC_API_KEY` vacía y, donde hace falta el modelo, es el propio navegador quien contesta a `/api/tutor` con respuestas escritas en el formato del AI SDK.
- **Razón:** ninguna pasada gasta cuota ni depende de la red. Una variable ya definida, aunque esté vacía, no la sobrescribe `.env.local`: comprobado en el código de `@next/env`.
- **Coste:** las respuestas grabadas están escritas a mano; si el AI SDK cambia su formato, hay que actualizarlas. Lo que hace el modelo de verdad se comprueba aparte, con llamadas reales contadas (13 el 29/10/2026: ver "Tutor: Claude Haiku 5.5 con el AI SDK").

## Instrucciones del tutor en español

- **Qué:** el prompt del modelo está en español, como la interfaz.
- **Razón:** es texto del producto, lo leen el modelo y quien revise el código, y fija el idioma de las respuestas.
- **Coste:** se aparta de la convención de escribir el código en inglés; los nombres y los comentarios siguen en inglés.

## Tests de navegador con Playwright

- **Qué:** Playwright 1.64.1 con el Chrome instalado a 1280, 768 y 375 px (este último táctil) y con el Firefox de Playwright a 1280. Cubren la galería (direcciones, orden, estado al volver por enlace, con el navegador y tras varias órbitas, entrada directa y 404), el reproductor (arranque, teclado y movimiento reducido), las lecciones (laboratorio, preguntas y lanzador), el tutor (modo reducido, herramientas, reenvío y errores) y la maqueta (sin scroll horizontal, `lang` y enlace de salto). Sirven el build de producción en el puerto 3100.
- **Razón:** el estado al volver y el teclado solo se comprueban en un navegador real. Las consultas usan `getByRole`, que ignora las páginas que Activity deja ocultas. Cada test nuevo se ha visto fallar con una mutación del código que protege.
- **Coste:** una dependencia de desarrollo y unos 2 minutos por pasada completa. El Firefox de Playwright se atasca a veces en Windows al cerrar un contexto cuando el test ya ha terminado ("can't access property _maybeDontRestoreTabs"), y más con varios contextos a la vez; aislado, doce recorridos de la galería al detalle muestran el título en 108 a 336 ms. Por eso la pasada usa dos workers (con cuatro, los navegadores, sus workers de órbitas y el servidor compiten por la CPU), Firefox corre un test cada vez y reintenta una vez, y el informe marca como inestable lo que pase al reintentar. Medido el 28/10/2026: dos pasadas seguidas, 80 de 80. Cada pasada construye y sirve el código tal como está: un servidor que ya escuche en el puerto no se reutiliza, porque el 29/10/2026 uno olvidado sirvió un build anterior y dio por buenos tests y mutaciones que no lo eran.
- **Alternativa descartada:** pruebas manuales en cada cambio, y el Firefox instalado, que Playwright no puede controlar: solo maneja su propia compilación.

## Cache Components activado

- **Qué:** `cacheComponents: true` en `next.config.ts`, el valor por defecto de create-next-app 16.4.3.
- **Razón:** con Cache Components, Next oculta la ruta anterior con `<Activity>` en lugar de desmontarla. Al volver del detalle a la galería se conservan el estado de React, el DOM y el scroll, que es lo que pide el enunciado, sin código propio. La documentación de Next anuncia además que en la próxima versión mayor estará siempre activo.
- **Coste:** las rutas ocultas siguen en el DOM. Las animaciones y suscripciones se limpian en sus efectos, los estilos globales de una página se desactivan mientras está oculta y los tests de navegador usan selectores que filtran por visibilidad. Next conserva hasta tres rutas; al pasar de ahí, la más antigua vuelve a su estado inicial.
- **Alternativa descartada:** desactivarlo y guardar el estado de la galería en su layout, con el scroll restaurado a mano.

## Sin React Compiler

- **Razón:** la animación se dibuja en un canvas fuera del ciclo de render, así que la memoización automática aportaría poco.
- **Coste:** memoización manual allí donde se mida que hace falta.
- **Alternativa descartada:** activarlo, lo que añade `babel-plugin-react-compiler` al build.

## npm como gestor de paquetes

- **Razón:** viene con Node; quien revise el proyecto no necesita instalar nada más.
- **Coste:** instalaciones algo más lentas que con pnpm.
- **Alternativa descartada:** pnpm.

## Node 22 fijado

- **Qué:** `engines.node` a `22.x` y `@types/node` a `^22` (la plantilla traía `^20`).
- **Razón:** la misma versión mayor en local y en Vercel, y tipos que corresponden al runtime real.
- **Coste:** el despliegue queda atado a Node 22 hasta que se cambie a propósito.
- **Alternativa descartada:** dejar que Vercel use su versión por defecto.

## ESLint 9, la versión de la plantilla

- **Razón:** con ESLint 10, tres plugins que incluye `eslint-config-next` 16.4.3 (`eslint-plugin-import`, `eslint-plugin-jsx-a11y` y `eslint-plugin-react`) no la admiten en sus dependencias compartidas. npm las fuerza y `npm ls` da el árbol por inválido. Se probó y se volvió a la 9.
- **Coste:** al instalar, npm avisa de que ESLint 9 ya no tiene soporte.
- **Alternativa descartada:** ESLint 10 con esas dependencias forzadas. Se revisará cuando `eslint-config-next` la admita.

## Script `typecheck`

- **Qué:** `npm run typecheck` ejecuta `next typegen && tsc --noEmit`.
- **Razón:** los tipos de las rutas (`LayoutProps`, `PageProps`) los genera Next en `.next/types`. En un clon recién hecho no existen todavía y `tsc` falla por eso, no por el código.
- **Coste:** generar esos tipos antes de cada comprobación, un par de segundos.
- **Alternativa descartada:** depender de haber lanzado antes `next dev` o `next build`.

## Saltos de línea LF

- **Qué:** `.gitattributes` con `* text=auto eol=lf`.
- **Razón:** el proyecto se desarrolla en Windows, donde Git suele convertir a CRLF. Así el repositorio y las copias de trabajo usan LF en cualquier sistema.
- **Alternativa descartada:** dejarlo a la configuración de cada máquina.

## AGENTS.md fuera del repositorio

- **Razón:** Next 16.4 crea y reescribe este fichero al arrancar `next dev` cuando detecta un asistente de IA. Es un fichero generado que no aporta a quien lee el código, y su indicación (consultar la documentación de la versión instalada) se sigue igualmente.
- **Alternativa descartada:** versionarlo, como sugiere Next.

## Marcador de despliegue `/api/version`

- **Razón:** devuelve el commit con el que se construyó el despliegue (`VERCEL_GIT_COMMIT_SHA`), así que se puede comprobar qué versión está publicada por lo que sirve. Con Cache Components la ruta se prerenderiza en el build, de modo que el valor queda fijado en cada despliegue. En local devuelve `null`.
- **Coste:** una ruta pública que revela el commit, que de todos modos es público en el repositorio.
- **Alternativa descartada:** fiarse solo del panel de Vercel.
