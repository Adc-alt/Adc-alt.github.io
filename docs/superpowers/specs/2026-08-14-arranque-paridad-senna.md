# Spec: pantalla de arranque con paridad 100% respecto a senna.social

**Fecha:** 2026-08-14
**Referencia:** https://senna.social/ (primera página, la de arranque)
**Estado de la medición:** completa. HTML, CSS y JS descargados y leídos enteros;
valores de render tomados con Chrome DevTools Protocol a 1280x900.

---

## 1. Qué se quiere

La pantalla de arranque del portfolio tiene que ser **la misma** que la de la
referencia: mismo texto en inglés, misma maqueta, misma tipografía, mismos
colores, mismos tiempos, mismas animaciones.

Se cambian **tres cosas y solo tres**, que son las que identifican al dueño:

| # | En la referencia | Aquí |
|---|---|---|
| 1 | `Senna's Social Network` | `Adc-alt's Portfolio` |
| 2 | `SENNASOFT Corporation` | `ADCSOFT Corporation` (y el año 2025 → 2026) |
| 3 | El logo dibujado a mano (PNG) | Un pingüino en píxeles (SVG propio) |

Consecuencia de la 3: el prefijo de la marca, `SEN:LAN FUNNY MAN` → `ADC:LAN FUNNY MAN`.

Y una cuarta por obligación, no por gusto: **el icono de arriba a la izquierda**
(un sello con lazo, PNG de 42x58) no se puede copiar porque es un dibujo suyo.
Se sustituye por un sello equivalente dibujado en SVG, mismo hueco y mismo tamaño.

**Todo lo demás va literal**, incluidas las frases que son chistes personales
suyos (`Micro-D1-NK`, `Dastardly drawings`, `LAN Funny Man [22]`,
`lego-island-two.pcm`). Son decisión explícita del dueño del portfolio, repetida
cuatro veces. Están todas en un único objeto de configuración para que cambiarlas
sea una línea.

**Nada en español y ninguna mención a `comecocos`** en toda la pantalla.

## 2. Atribución

La referencia queda acreditada en el `README.md`. La tipografía
(AcPlus IBM VGA 8x16, de VileR, CC BY-SA 4.0) ya está acreditada en el pie del
sitio, como exige su licencia. No se copia ni se sirve **ningún fichero** de
senna.social: ni imágenes, ni CSS, ni JS. Los dibujos son propios.

---

## 3. Contenido literal de la referencia

Sacado de `https://senna.social/` (77 líneas de HTML). Cada línea con su
`data-order`, que es lo que decide cuándo aparece.

```
order  texto
─────  ────────────────────────────────────────────────
  1    Senna's Social Network [Version 95.0.218y2k3]
  4    Copyright (c) 2025 SENNASOFT Corporation.
  2    (icono, imagen 42x58, arriba a la izquierda)
  3    (logo, imagen 266x168, arriba a la derecha)

  5    Loading...

  6    PROCESSOR MODEL :        Micro-D1-NK
  7    Memory Testing:          WHAT?
  8    Dastardly drawings :     [número]  KB
  9      └ el número, que sube solo

 10    Keyboard & Mouse     ...
 11    CRT Monitors         ...
 12    LAN Funny Man [22]   ...
 13                                CONNECTED
 14                                PITCHING & WHINING
 15                                ONLINE

 16    CD-ROM inserted :
 17                      lego-island-two.pcm

 18    [PRESS ANY KEY TO CONTINUE]
```

Fíjate en que los nombres de los chequeos (10-12) salen **antes** que sus
veredictos (13-15). No es un adorno: es lo que hace que parezca una máquina
probándose a sí misma.

### El contador

`textloader.js` hace subir el número de la línea 8 por una escalera fija:

```js
numbers   = [24, 25, 507, 1337, 5678, 9001, 12345, 42069, 80085, 91021]
intervals = [275, 30, 30, 30, 30, 30, 30, 50, 50, 50]
```

Despacio al principio (275 ms), disparado en medio (30 ms), y frenando al final
(50 ms). Dura unos 830 ms desde que aparece.

> La implementación de la referencia tiene un fallo: pinta el primer valor dos
> veces (una al montar y otra en el primer `setTimeout`). Como el valor es el
> mismo, no se ve. Aquí se implementa sin el duplicado.

---

## 4. Tiempos

De `textloader.js`. Milisegundos desde `DOMContentLoaded`.

| order | ms | qué |
|---|---|---|
| 1 | 1000 | título |
| 4 | 1200 | copyright |
| 5 | 1400 | `Loading...` |
| 2 | 1600 | icono |
| 6 | 1600 | spec 1 |
| 7 | 1700 | spec 2 |
| 3 | 1800 | logo |
| 8 | 1800 | spec 3 (etiqueta y unidad) |
| 9 | 1900 | spec 3 (el número) → arranca el contador |
| 10 | 3000 | nombre del chequeo 1 |
| 11 | 3050 | nombre del chequeo 2 |
| 12 | 3100 | nombre del chequeo 3 |
| 13 | 3200 | veredicto 1 |
| 14 | 3250 | veredicto 2 |
| 15 | 3700 | veredicto 3 ← **450 ms de más** |
| 16 | 3800 | `CD-ROM inserted :` |
| 17 | 3900 | el nombre del fichero |
| 18 | 4000 | el prompt |

Dos silencios que hay que respetar porque son la mitad del carácter de la pantalla:

- **1,1 s entre 1900 y 3000.** La pantalla se queda quieta. Sin esto es solo
  texto apareciendo.
- **450 ms de más en el último veredicto** (3250 → 3700). Como si le costara.

**No entra sola.** Verificado: a los 25 s sigue en el arranque si no tocas nada.

---

## 5. Medidas de render

Tomadas con CDP sobre la referencia a 1280x900.

| Propiedad | Valor |
|---|---|
| Tipografía | `AcPlus IBM VGA 8x16` |
| Tamaño | `24px` |
| Interlineado | `1.3` (= 31,2 px) |
| Ancho de carácter | **9,99 px** (avance 0,4167em) |
| Color del texto | `#dedede` |
| Color del `body` | `#b3b3b3` |
| Fondo | `#060606` |
| Padding del `main` | `1%` (+ los 8 px de margen del `body`) = 20,6 px a 1280 |
| Primera línea | top 20,6 / left 77,6 (el icono ocupa los primeros 57 px) |
| Icono | 42x58, arriba a la izquierda, `margin-right: 15px` |
| Logo | 266x168, `position:absolute; right:0; top:10%` |
| Prompt | top 556 |
| Alto del documento | 1096 (`#container { height: 1080px }`, `body { overflow-y: hidden }`) |

### La tipografía tiene que ser la variante `AcPlus`

No vale `Web437` ni `WebPlus`. La IBM VGA 8x16 se veía en una VGA de 720x400
estirada a una pantalla 4:3, o sea con el píxel más alto que ancho. `AcPlus`
(*aspect-corrected*) lleva ese estirón dentro: el avance es **0,4167em** en vez
de 0,5em. Con `WebPlus` las letras salen cuadradas y anchas y el parecido se
rompe aunque cuadre todo lo demás.

Ya está instalada en `public/fonts/AcPlus_IBM_VGA_8x16.woff2` (15.556 bytes),
sacada del pack `_win` de int10h (los `Ac` no vienen en el pack web) convirtiendo
el TTF con `fonttools`.

### La rejilla de columnas

```css
.aligned-section              { display: flex; flex-wrap: wrap; gap: 20px; }
.aligned-section span         { min-width: 200px; }
.aligned-section span:nth-child(2) { min-width: 40px; text-align: center; }
.aligned-section span:last-child   { text-align: left; }
/* el bloque de specs abre más: */
<div class="aligned-section" style="gap: 50px">
/* el número y su unidad: */
.number { display: inline-block; width: 20px; text-align: right; }
.unit   { display: inline-block; margin-left: -20px; }
```

Posiciones que salen de ahí, y que son la prueba de que la copia está bien:

| columna | x |
|---|---|
| etiqueta | **20** |
| valor de un spec (gap 50) | **270** |
| los `...` (gap 20) | **240** |
| veredicto | **300** |
| unidad `KB` | **340** |

> **200 px se escriben como `20ch`.** A 24 px un `ch` de esta fuente mide
> 9,99 px, así que `20ch` da los mismos 200 px clavados — pero además encoge
> solo si el móvil baja la fuente. Con píxeles fijos no encogería. Mismo trato
> para 40px → `4ch`, gap 20px → `2ch`, gap 50px → `5ch`, `-20px` → `-2ch`.

### La aparición: no hay fundido, hay un salto con 500 ms de retraso

```css
span { opacity: 0; visibility: hidden;
       transition: opacity 0.5s ease, visibility 0s 0.5s; }
```

Esto **parece** un fundido de medio segundo y no lo es. `visibility` tiene
`0s` de duración pero **`0.5s` de retardo**, así que el elemento sigue en
`hidden` durante todo el tiempo que la opacidad sube de 0 a 1. Cuando por fin
pasa a `visible`, la opacidad ya vale 1.

**Resultado: cada línea aparece de golpe, ya opaca, 500 ms después de la hora
que dice la tabla.**

Medido sobre la referencia con `requestAnimationFrame` + `getComputedStyle`
(`Loading...`, cuyo retardo nominal es 1400 ms):

```
t=1552ms  opacity=0.51    visibility=hidden
t=1730ms  opacity=0.92    visibility=hidden
t=1880ms  opacity=0.9994  visibility=hidden
t=1898ms  opacity=1       visibility=visible   ← aquí se ve, ya opaco
```

Casi con seguridad es un fallo suyo, no una decisión. Da igual: se ve, y se
copia. **Las dos consecuencias que hay que respetar:**

1. **La aparición es seca**, no un fundido. Un fundido de verdad se nota y sería
   otra pantalla.
2. **La secuencia entera acaba a los 4500 ms**, no a los 4000: todo va corrido
   500 ms. La pausa de 1,1 s y los 450 ms del último veredicto se mantienen,
   porque el desplazamiento es igual para todos.

Se copia el CSS tal cual en vez de sumar 500 a cada retardo: así el CSS de la
referencia y el de aquí son el mismo texto, y el comentario evita que alguien
lo "arregle" más adelante.

> El contador arranca en su hora **nominal** (1900), no en la visible (2400),
> porque en la referencia sale del mismo `setTimeout` que enciende la línea.
> O sea que los primeros 500 ms del contador corren escondidos y se empieza a
> ver por el segundo o tercer peldaño.

### El prompt

Parpadea invirtiendo el vídeo, no con opacidad:

```css
.blinking { display: inline-block; animation: blink-effect 1s steps(1, start) infinite; }
@keyframes blink-effect {
  0%   { color: #FFFFFF; background-color: #060606; }
  50%  { color: #060606; background-color: #FFFFFF; }
  100% { color: #FFFFFF; background-color: #060606; }
}
```

### Lo que la referencia NO tiene

Nada de scanlines, viñeteado, curvatura ni ruido. Ni un solo efecto de CRT.
Es lo primero que convierte el homenaje en parodia.

---

## 6. Lo que se aparta de la referencia, y por qué

Cuatro cosas. Ninguna se ve en un escritorio.

| Se aparta | Por qué |
|---|---|
| Es un **overlay** sobre el portfolio, no una página que navega a `home.html` | El portfolio entero tiene que estar en el HTML detrás, o los buscadores y las tarjetas de previsualización indexan el arranque en vez del sitio. Requisito del encargo original. |
| El prompt es un **`<button>` de verdad** | La referencia usa un `<span>`: no se puede tabular y un lector de pantalla no lo anuncia. El texto es idéntico; solo cambia la etiqueta HTML. |
| **16 px por debajo de 700 px** de ancho | La referencia desborda en un móvil. Las columnas van en `ch`, así que la rejilla encoge entera y mantiene la forma. |
| **Apagado de tubo de 300 ms al salir** | Tapa el cambio del overlay al portfolio. La referencia no lo necesita porque navega a otra página. |

Y dos requisitos del encargo original que la referencia no tiene y aquí se
mantienen:

- **Solo arranca en `/` y en `/index.html`.** Los enlaces profundos y `/work/`
  (la URL del currículum) nunca lo ven.
- **`localStorage.boot_seen`**: la segunda visita no lo ve.
- **`prefers-reduced-motion`**: sale entero de golpe, sin fundido, sin contador,
  sin parpadeo y sin apagado.
