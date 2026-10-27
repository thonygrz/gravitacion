# Decisiones técnicas

Cada decisión con su razón, su coste y la alternativa descartada. El README las resume.

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
