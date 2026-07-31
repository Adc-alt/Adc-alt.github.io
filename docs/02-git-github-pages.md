# 02 — Git, GitHub y GitHub Pages

Tres cosas distintas que se confunden constantemente:

- **Git** es un programa que corre en tu máquina y guarda el historial de una carpeta. Funciona sin internet.
- **GitHub** es una empresa que aloja copias de repos git y añade cosas encima (issues, PRs, CI).
- **GitHub Pages** es una función de GitHub que coge los ficheros de un repo y los sirve por HTTP.

Puedes usar git sin GitHub. Puedes usar GitHub sin Pages. Aquí usamos los tres.

---

## Git: el modelo mental

Git guarda **snapshots completos** del árbol de ficheros, no diferencias. Cada snapshot es un
*commit*, identificado por el SHA-1 de su contenido. Un commit apunta a su padre, y esa cadena
de punteros es el historial.

Hay tres sitios donde puede estar un cambio:

```
  working tree          staging area (index)        repositorio
 (tus ficheros)      (lo que irá al commit)      (historial inmutable)
       │                       │                         │
       │──── git add ─────────>│                         │
       │                       │──── git commit ────────>│
       │<─────────────── git checkout ───────────────────│
```

El *staging area* es la parte que suele chirriar al principio. Existe para que puedas hacer un
commit con **parte** de tus cambios. Si eso no te hace falta, `git commit -a` se lo salta.

### Comandos que usé y qué hace cada uno

| Comando | Qué hace exactamente |
|---------|---------------------|
| `git init` | Crea el subdirectorio `.git/`. Eso es *todo*. Ahí dentro vive el historial completo. Borra `.git/` y vuelve a ser una carpeta normal. |
| `git branch -M main` | Renombra la rama actual a `main`. `-M` fuerza el renombrado. Necesario si tu git es viejo y crea `master` por defecto. |
| `git add -A` | Mete al staging area todos los cambios: nuevos, modificados y **borrados**. `git add .` en git moderno hace lo mismo, `-A` es explícito. |
| `git commit -m "..."` | Congela el staging area en un commit nuevo con ese mensaje. |
| `git remote add origin <url>` | Guarda un alias (`origin`) para una URL remota. No conecta con nada, solo apunta una nota en `.git/config`. |
| `git push -u origin main` | Manda los commits al remoto. `-u` deja configurado que `main` sigue a `origin/main`, para que a partir de ahí baste `git push`. |

### Qué NO va al repo

Un `.gitignore` lista patrones de ficheros que git debe ignorar. Aquí **no hay `.gitignore`**
porque no hay nada que ignorar: sin `node_modules/`, sin build, sin secretos. Cuando lo haya,
se añade.

---

## GitHub Pages: cómo convierte un repo en una web

Pages tiene dos modos:

### 1. Deploy from a branch (el que usamos)

Le dices "sirve la rama `main`, carpeta raíz". Cada vez que haces push, GitHub dispara un
workflow interno (`pages-build-deployment`) que:

1. Clona el repo.
2. **Si no existe `.nojekyll`**, pasa los ficheros por [Jekyll](https://jekyllrb.com/),
   un generador de sitios en Ruby. Jekyll convierte `.md` en `.html`, aplica plantillas
   y **borra del resultado todo lo que empiece por `_`**.
3. Sube el resultado a un CDN y lo sirve.

Ese paso 2 es la fuente de la mitad de los "¿por qué no aparece mi fichero?" del mundo.
Por eso el repo tiene un **`.nojekyll` vacío**: le dice a Pages "no proceses nada, copia los
ficheros tal cual". Un fichero de 0 bytes que elimina una clase entera de fallos raros.

### 2. GitHub Actions

Escribes tú el workflow que genera el sitio (build de Astro, Next, lo que sea) y publicas el
resultado. Es lo que hará falta el día que haya un paso de build. Hoy no lo hay.

### Sitio de usuario vs sitio de proyecto

Esta es la decisión de nombre que hay que entender **antes** de crear el repo:

| Tipo | Nombre del repo | URL resultante | Cuántos puedes tener |
|------|-----------------|----------------|----------------------|
| **De usuario** | `<usuario>.github.io` — exactamente ese | `https://<usuario>.github.io/` | 1 por cuenta |
| **De proyecto** | cualquier otro nombre | `https://<usuario>.github.io/<repo>/` | ilimitados |

Elegí **sitio de usuario** (`Adc-alt.github.io`) por dos razones:

1. **URL limpia**, sin `/portfolio/` colgando. Para un portfolio, la URL *es* parte del producto.
2. **El sitio se sirve desde la raíz `/`**. En un sitio de proyecto, la raíz es `/portfolio/`,
   y cualquier ruta absoluta que escribas (`/estilos.css`, `/img/foto.png`) apunta a un sitio
   que no existe. Se arregla con rutas relativas o configurando un `base` en el generador,
   pero es una fuente constante de "funciona en local y en producción no".

**Alternativa descartada:** repo `portfolio` (sitio de proyecto). Ventaja real: dejas libre el
slot del sitio de usuario. Pero el slot solo se usa una vez y esto es justo la web que merece
la URL buena. Si algún día hace falta cambiar, renombrar el repo en GitHub es un botón.

**Efecto secundario que descubrí al hacerlo:** si el repo se llama `<usuario>.github.io`,
GitHub **activa Pages solo**, sin que se lo pidas. Mi intento de activarlo por API devolvió
`409 GitHub Pages is already enabled`. Con un repo de proyecto sí hay que encenderlo a mano.

### Detalles que conviene saber

- **HTTPS gratis y automático.** GitHub emite el certificado (Let's Encrypt). No hay que hacer nada.
- **La propagación tarda.** El primer despliegue puede necesitar entre 30 segundos y varios
  minutos. Si acabas de pushear y ves un 404, espera antes de tocar nada.
- **Caché agresiva.** El CDN cachea. Si actualizaste y ves lo viejo, recarga forzada
  (`Ctrl+Shift+R`) antes de asumir que el deploy falló.
- **El repo tiene que ser público** para usar Pages gratis. Con cuenta Pro también funciona en
  privado, pero **el sitio publicado siempre es público**. No metas nada en el repo que no
  quieras que se lea: aunque no enlaces un fichero, se sirve igual si alguien acierta la URL.
- **Límites** (los "soft limits" de GitHub): 1 GB de repo, 100 GB de tráfico al mes,
  10 builds por hora. Un portfolio no se acerca ni de lejos.

---

## La CLI de GitHub (`gh`)

`gh` es el cliente de línea de comandos oficial de GitHub. Hace por HTTP lo que harías
clicando en la web: crear repos, abrir PRs, leer issues.

- Ya estaba instalado en esta máquina, en `~/.local/bin/gh`.
- La autenticación estaba hecha (`gh auth status` → cuenta `Adc-alt`). `gh` guarda el token en
  `~/.config/gh/hosts.yml`.
- **Bonus importante:** `gh auth setup-git` configura git para que use el token de `gh` como
  credencial. Sin eso, un `git push` por HTTPS se queda colgado esperando usuario y contraseña
  sin decir nada — parece que la red falla, y es que está pidiendo una contraseña que nadie ve.

Instalarlo desde cero: https://cli.github.com/

## Fuentes que consulté

- Documentación oficial de GitHub Pages: https://docs.github.com/es/pages
- Tipos de sitio y nombres de repo: https://docs.github.com/es/pages/getting-started-with-github-pages/what-is-github-pages
- Límites de uso: https://docs.github.com/es/pages/getting-started-with-github-pages/github-pages-limits
- Manual de `gh repo create`: https://cli.github.com/manual/gh_repo_create
- Pro Git (libro completo, gratis, la referencia de git): https://git-scm.com/book/es/v2
