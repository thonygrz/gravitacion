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
