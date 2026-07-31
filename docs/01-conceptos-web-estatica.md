# 01 — Conceptos: qué es una web estática

## Lo que pasa cuando alguien escribe tu URL

1. El navegador resuelve `adc-alt.github.io` a una IP por DNS.
2. Abre una conexión TCP + TLS con esa IP y manda una petición HTTP: `GET / HTTP/1.1`.
3. El servidor responde con una cabecera (`200 OK`, `Content-Type: text/html`) y un cuerpo:
   el contenido de tu `index.html`, byte por byte.
4. El navegador parsea ese HTML. Cada `<link>`, `<script>` o `<img>` que encuentra dispara
   **otra** petición HTTP para bajar ese recurso.
5. Con el HTML construye el DOM, con el CSS calcula estilos, y pinta.

Eso es todo. No hay más magia.

## Estático vs dinámico

La única diferencia está en el paso 3: **de dónde sale el HTML que responde el servidor**.

- **Estático**: el fichero ya existe en disco. El servidor lo lee y lo manda. La respuesta es
  idéntica para todo el mundo. Esto es lo que hacemos aquí.
- **Dinámico**: no hay fichero. Se ejecuta código (PHP, Node, Python...) que consulta una base
  de datos y *genera* el HTML en ese momento. La respuesta depende de quién pregunte.

Un portfolio es contenido idéntico para todos los visitantes. Por tanto **no necesita servidor
dinámico, ni base de datos, ni backend**. Y como no lo necesita, tampoco necesita hosting de
pago: servir ficheros es tan barato que GitHub lo regala.

> **Regla mental:** ¿el HTML que ve el visitante A es igual al que ve el visitante B?
> Sí → estático. Y estático es más rápido, más barato y prácticamente imposible de hackear
> (no hay código ejecutándose en el servidor que atacar).

## Las tres capas de una página

| Lenguaje | Responsabilidad | Analogía estructural |
|----------|-----------------|----------------------|
| **HTML** | Qué contenido hay y qué significa | El esqueleto |
| **CSS** | Cómo se ve | La piel y la ropa |
| **JavaScript** | Qué pasa cuando interactúas | Los músculos |

Se pueden usar las tres desde un único fichero `.html` (con `<style>` y `<script>` dentro).
Empezamos así: un fichero, cero dependencias. Separar en `.css` y `.js` es una optimización
que tiene sentido cuando el fichero crece o cuando quieres que el navegador los cachee por
separado. Todavía no.

## Qué NO instalé, y por qué

Esto es lo importante de este primer paso: **no instalé nada**.

Nada de React, Vue, Astro, Next, Tailwind, Vite, npm, node_modules. Ni un solo paquete.

Todos esos existen para resolver problemas que aparecen cuando el sitio crece:
componentes que se repiten, muchas páginas, datos que cambian, equipos grandes.
Una página con un `<h1>` no tiene ninguno de esos problemas.

El coste de meterlos de entrada no es solo el tiempo de instalación: es que ya no puedes
abrir el fichero y ver lo que hay. Necesitas un proceso de build, un servidor de desarrollo,
y aprender la abstracción antes que la cosa que abstrae. Vamos al revés: primero HTML plano,
y cuando duela, sabremos exactamente qué dolor está resolviendo la herramienta.

**Alternativa descartada:** empezar con un generador de sitios estáticos (Astro, Hugo, Eleventy).
Son buenas opciones y en algún momento igual migramos. Pero introducen un paso de build entre
"edito un fichero" y "veo el resultado", y ahora mismo ese paso solo añade cosas que pueden
fallar sin enseñar nada sobre la web.

## Fuentes que consulté

- MDN, estructura de un documento HTML: https://developer.mozilla.org/es/docs/Learn_web_development/Core/Structuring_content
- MDN, cómo funciona la web (petición/respuesta): https://developer.mozilla.org/es/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work
- Especificación HTML viva (referencia definitiva, densa): https://html.spec.whatwg.org/

MDN es la referencia buena. Si buscas algo de HTML/CSS/JS en Google, añade `mdn` a la búsqueda
y te ahorras los blogs de contenido reciclado.
