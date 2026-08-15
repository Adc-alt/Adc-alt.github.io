---
title: "El sitio se está convirtiendo en un Windows XP"
date: 2026-08-15
summary: "Esta ventana es la primera pieza. El plan es que el portfolio entero acabe viviendo dentro del escritorio."
---

Lo que estás leyendo es una ventana de verdad: se arrastra por la barra de título,
se minimiza a la barra de tareas y se cierra. El contenido no lo pinta JavaScript,
está en el HTML desde el build; el JavaScript solo mueve la ventana. Si lo
desactivas, la ventana sigue aquí y se lee igual — solo deja de moverse.

El fondo es Bliss, el de verdad. La barra de tareas no: esa está dibujada con CSS
a partir de colores medidos sobre capturas, píxel a píxel. Tiene tres detalles que
parecen tonterías y son justo lo que la hace reconocible:

- El azul de la barra **no es un degradado**. Es un filo claro de seis píxeles, un
  cuerpo plano y tres píxeles que oscurecen de golpe al final.
- La bandeja del reloj es **más clara** que la barra, no más oscura. Lo que la hace
  parecer hundida es un filo oscuro de un píxel a su izquierda.
- El redondeo del botón de Inicio no es circular: se aparta cuatro píxeles en
  horizontal y tarda diez filas en hacerlo.

El plan es que esto sustituya al sitio. El portfolio pasará a vivir en ventanas
como ésta y la estética de recreativa desaparecerá. Todavía no: un escritorio sin
ventanas era un callejón sin salida, y por eso vive en `/xp/` mientras se
construye.
