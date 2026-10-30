# Brisa

[Aplicación en vivo](https://brisa.erikjhonatan.dev) · [Código fuente](https://github.com/ErikJhonatan/brisa)

## Despliegue

Node.js 24 y npm. Ejecuta `npm ci`, `npm test`, `npm run build` y `npx wrangler deploy`. `wrangler.jsonc` configura los archivos estáticos y el dominio `brisa.erikjhonatan.dev` en Cloudflare Workers. La autenticación se gestiona con Wrangler, nunca con credenciales dentro del repositorio. GitHub Actions valida compilación, pruebas unitarias, flujos móviles, voz y caché sin conexión en cada push o pull request.

El código de la aplicación usa MIT. Los audios y herramientas externas conservan sus licencias y créditos propios; véanse `LICENSE`, `public/audio/CREDITS.md` y `public/voices/README.md`. Este proyecto no incluye claves de ElevenLabs ni datos personales de las sesiones de sus usuarios.

App mobile first de meditación y respiración, construida con Vite, React y TypeScript. Funciona de forma local, sin cuentas ni servidor de datos.

## Ejecutar

```sh
npm install
npm run dev
```

```sh
npm run build
npm test
npm run preview -- --port 5174
```

HeroUI 2 proporciona botones, switches, accesibilidad y el tema de color; Vaul implementa los paneles inferiores. Anime.js 4 anima la mascota SVG original, las entradas y la esfera. NumberFlow anima el temporizador. Framer Motion es dependencia de HeroUI; las animaciones propias usan Anime.js.

Incluye inicio, biblioteca filtrable con nueve prácticas, favoritas, plan semanal, preparación, duración de 1/2/3/5/10 minutos, check-in opcional antes y después, sesión con pausa/reinicio y alternativa de grounding, cierre, historial y promedios personales. Se puede omitir la retención en caja y 4–7–8. Las sesiones, música y narración se pausan al ocultar la pestaña. Los ejercicios no respiratorios recorren sus indicaciones a lo largo de la duración elegida, sin imponer un ritmo de respiración.

Los ajustes, favoritas y hasta 500 sesiones se conservan en localStorage. Las nueve guías de voz son archivos incluidos en la app. Se puede exportar el historial y preferencias a JSON y borrar los datos mediante confirmación explícita, incluidos archivos importados en versiones anteriores. No hay transmisión de check-ins a un servidor.

Los recordatorios se muestran dentro de la app al llegar la hora elegida o al volver después de esa hora. La exportación `.ics` crea un evento diario con alarma para importar en el calendario del celular; los avisos con la app cerrada dependen del calendario. No se ofrecen notificaciones push de fondo.

La vibración requiere un navegador compatible y un dispositivo real; Safari en iOS no ofrece la API Vibration. La app funciona sin vibración. La disponibilidad de la API no garantiza que el hardware produzca vibración. Prueba desde un móvil con un origen seguro HTTPS.

Las nueve introducciones se generaron en ElevenLabs con Alex — Deep, Resonant and Confident, velocidad 0.80 y pausas entre frases. La voz es masculina, grave y calmada, con el tono aprobado por el usuario. El reloj comienza cuando termina la introducción; esta se puede pausar, reanudar, saltar o desactivar. No hay carga de archivos, claves ni llamadas a ElevenLabs durante el uso. Los guiones originales se pueden leer desde los ajustes. Véase [guías de voz](public/voices/README.md). Las fuentes provienen de Google Fonts y tienen alternativas locales.

## Audio y uso sin conexión

Cuatro grabaciones reales de bibliotecas CC0: Pretty y jazz aug 10 10 22 2021 (Alex McCulloch), Chills (Holizna), City Lights (HoliznaCC0). Cada página de origen identifica CC0; [créditos y fuentes](public/audio/CREDITS.md). Ninguna pista musical se genera por código. Los sonidos de aire al inhalar y exhalar sí se sintetizan con Web Audio, sincronizados con cada fase. Los tres volúmenes (música, respiración y voz) son independientes. La música y los sonidos de respiración empiezan desactivados; la introducción hablada está activada inicialmente.

En producción se registra un service worker que guarda el shell, los guiones y las nueve voces (unos 6.1 MB). El botón “Guardar música sin conexión” descarga las cuatro pistas (unos 18 MB) a Cache Storage. El worker responde a peticiones Range de música y voz y permite recargar y reproducir sin red. La primera descarga necesita conexión y espacio de almacenamiento. Las fuentes usan su fallback local al no haber red. En desarrollo no se registra el worker. La instalación en pantalla de inicio depende del soporte del navegador; se incluye manifest.

El panel de Vaul tiene un contenedor sin scroll y un cuerpo con scroll limitado al contenido. El pseudo-elemento extendido de Vaul está desactivado para impedir el espacio vacío que producía un recorrido adicional de dos alturas de panel.

Paleta: marfil #FAF7F2, crema #FFFDFA, salvia #E4EBE3, bosque #355848, arcilla #C98F75, carbón #292F2B, gris oliva #62685F. Espaciado, jerarquía, contraste y controles móviles siguen Refactoring UI.

La pasada de diseño usa [unslop-ui v2](https://github.com/JCarterJohnson/vibecoded-design-tells/blob/main/skill/SKILL.md), localizada en [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1ubc02m/unslopui_v2_a_claude_skill_that_flags_and_removes/). Se preservó la paleta aprobada y la mascota original; se retiraron etiquetas de relleno, tarjetas repetidas y animaciones de entrada uniformes. El inicio prioriza comenzar una sesión, y la biblioteca usa filas legibles. No se usa Impeccable ni se añadieron dependencias de diseño. `scripts/devibe_scan.py` procede de ese repositorio y usa solo la biblioteca estándar de Python. `npm run design:scan` ejecuta el escáner orientativo; no sustituye revisar las capturas.

Con el servidor en el puerto 5174, `npm run test:ui` comprueba el flujo móvil y guarda capturas en `test-results/`. `npm run test:features` prueba audio real, volúmenes, guiones fijos sin subida de archivos, geometría de scroll, favoritas, grounding y privacidad. `npm run test:voices` verifica los nueve MP3, pausa y reanudación, reloj en cero durante la introducción, comienzo al terminar el audio, salto y salida. `npm run test:offline`, con `npm run preview -- --port 5175`, comprueba la recarga sin red y peticiones Range para música y las nueve voces. Requieren `npx playwright install chromium` la primera vez. Las pruebas unitarias cubren fases, alternativas sin retención, preferencias, calendario y semana local.

La auditoría de dependencias conserva avisos de severidad baja en `deepmerge`, dependencia transitiva de HeroUI 2. La corrección sugerida por npm requiere migrar a HeroUI 3. No hay avisos moderados, altos ni críticos en la auditoría realizada. Vite señala un bundle JS mayor de 500 KB; queda como optimización futura antes de un lanzamiento de gran escala. La vibración física necesita validación en un celular compatible; la reproducción se verificó en Chromium.

Referencias de diseño: [Akib Ahmad](https://dribbble.com/shots/27138344-Mindfulness-Meditation-App), [Sienna Rose](https://dribbble.com/shots/27737766-Serenova-Meditation-Mindfulness-Mobile-App-UI), [Diana Larussa](https://dribbble.com/shots/27205119-Breathing-Exercise-App-UI-Meditation). La mascota y los gráficos del prototipo son originales.

Estas prácticas son recursos de bienestar; no sustituyen atención profesional. La duración de 1 minuto es una adaptación del producto, no una reproducción del protocolo de investigación de suspiro cíclico de 5 minutos diarios durante un mes. Fuentes: [Balban et al., 2023](https://doi.org/10.1016/j.xcrm.2022.100895), [NCCIH](https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety).
