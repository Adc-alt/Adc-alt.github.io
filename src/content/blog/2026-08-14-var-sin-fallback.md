---
title: "Un var() sin fallback no cae al siguiente valor: invalida la declaración entera"
date: 2026-08-14
summary: "El fallo que más tiempo me costó de todo el escritorio, y no daba ningún error en ningún sitio."
---

La pantalla de arranque usa esto para elegir tipografía:

```css
font-family: "AcPlus IBM VGA 8x16", var(--font-mono);
```

La idea es obvia: si la fuente pixelada no está, que caiga en una monoespaciada
del sistema. Funcionaba en la portada y no funcionaba en el escritorio, donde el
texto salía con la tipografía del navegador por defecto.

La causa es una regla de CSS que no se parece a nada más de CSS. `--font-mono`
estaba definida en la hoja global, y el escritorio no la importa a propósito. Un
`var()` que apunta a una variable que no existe **y no lleva valor de reserva**
no se salta: hace que la declaración entera sea *inválida en tiempo de cómputo*.
No cae al siguiente nombre de la lista — descarta la lista completa y la
propiedad hereda del padre.

Es distinto de casi todo lo demás en CSS, donde un valor que no se entiende se
tira y la regla anterior sigue en pie. Aquí la regla no llega a existir.

Lo que lo hace caro es que no hay error en ninguna parte: ni en el build, ni en
la consola, ni en el inspector, que te enseña la declaración escrita tal cual.
Solo se ve mirando la fuente renderizada y sabiendo que no es la que pediste.

Dos formas de que no vuelva a pasar:

```css
/* o le pones reserva al var() */
font-family: "AcPlus IBM VGA 8x16", var(--font-mono, monospace);

/* o te aseguras de que la variable existe donde se usa */
:root { --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace; }
```

Elegí la segunda porque el escritorio va a acabar teniendo su propio sistema de
tipografías y quería el sitio de la verdad en un solo lugar.
