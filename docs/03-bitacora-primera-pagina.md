# 03 — Bitácora: la primera página

Log cronológico y literal de todo lo que se ejecutó para pasar de "no existe nada" a
"https://adc-alt.github.io/ responde 200". Fecha: **2026-07-31**. Máquina: WSL2 sobre Windows,
Linux 6.6.114.1.

---

## Paso 0 — Comprobar el terreno antes de tocar nada

```bash
which gh git
gh auth status
git config --global user.name
git config --global user.email
```

Salida:

```
/home/adelg/.local/bin/gh
/usr/bin/git
github.com
  ✓ Logged in to github.com account Adc-alt (/home/adelg/.config/gh/hosts.yml)
  - Active account: true
  - Git operations protocol: https
  - Token: ghp_************************************
  - Token scopes: 'read:org', 'repo', 'workflow'
Adc-alt
antoniogitdc@gmail.com
```

**Conclusión: no había que instalar absolutamente nada.** `git` y `gh` ya estaban, y `gh` ya
estaba autenticado con scope `repo`, que es el que permite crear repos y configurar Pages.

Si en tu máquina no lo estuvieran:

```bash
sudo apt install git                      # Debian/Ubuntu
# gh: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
gh auth login                             # flujo interactivo en el navegador
gh auth setup-git                         # ← que git use el token de gh al hacer push
```

Ese último comando es el que evita que `git push` se cuelgue en silencio pidiendo una
contraseña por HTTPS que nunca ves.

### Comprobación de colisiones

```bash
ls -d /home/adelg/Adc-alt.github.io /home/adelg/portfolio
gh repo list Adc-alt --limit 100 --json name -q '.[].name' | grep -i -E 'portfolio|github.io'
```

Ninguna de las dos carpetas existía y ninguno de los ~repos de la cuenta se llamaba así.
Vía libre. Mirar antes de crear cuesta 2 segundos y evita machacar cosas.

---

## Paso 1 — Carpeta y repo local

```bash
mkdir -p /home/adelg/Adc-alt.github.io/docs
cd /home/adelg/Adc-alt.github.io
git init -q
git branch -M main
```

Decisiones tomadas aquí:

- **La carpeta local se llama igual que el repo remoto.** No hace falta técnicamente, pero
  que no coincidan es una fuente permanente de confusión.
- **Está en `~` (`/home/adelg`), el sistema de ficheros de Linux, no en `/mnt/c`.** Un repo git
  en el disco de Windows montado desde WSL da problemas de permisos (`chmod` falla si el montaje
  no tiene la opción `metadata`) y va bastante más lento.
- **`main`, no `master`.** Es el nombre por defecto en GitHub desde 2020.

---

## Paso 2 — Los ficheros

Cuatro cosas, ninguna generada por herramienta:

| Fichero | Qué es |
|---------|--------|
| `index.html` | La página. 23 líneas. Explicada línea a línea en [04](04-html-linea-a-linea.md). |
| `.nojekyll` | Fichero **vacío**, 0 bytes. Le dice a Pages "no proceses nada con Jekyll, copia los ficheros tal cual". Ver [02](02-git-github-pages.md). |
| `README.md` | Portada del repo en GitHub. |
| `docs/*.md` | Esta documentación. |

`index.html` se llama así porque es el nombre que un servidor HTTP busca por defecto cuando
pides un directorio. `GET /` → sirve `/index.html`. Si lo llamas `home.html`, la raíz da 404.

**No se instaló ninguna librería. No hay `package.json`, ni `node_modules`, ni build.**
El motivo largo está en [01](01-conceptos-web-estatica.md).

---

## Paso 3 — Primer commit

```bash
git add -A
git status --short
```

```
A  .nojekyll
A  README.md
A  docs/01-conceptos-web-estatica.md
A  docs/02-git-github-pages.md
A  docs/04-html-linea-a-linea.md
A  docs/README.md
A  index.html
```

La `A` de la izquierda significa *added*: son ficheros nuevos ya en el staging area.

```bash
git commit -m "Primera página: portfolio mínimo + docs de aprendizaje"
```

```
528ef0f Primera página: portfolio mínimo + docs de aprendizaje
 7 files changed, 450 insertions(+)
```

`528ef0f` es el prefijo del SHA del commit. Con eso puedes volver a este estado exacto para
siempre.

---

## Paso 4 — Crear el repo en GitHub y subirlo

Un solo comando hace cuatro cosas:

```bash
gh repo create Adc-alt.github.io \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Mi portfolio. Sitio estático sin dependencias, con /docs explicando cada paso."
```

| Flag | Qué hace |
|------|----------|
| `--public` | Repo público. **Obligatorio** para Pages gratis. |
| `--source=.` | Usa el repo git que ya existe en esta carpeta, en vez de crear uno vacío en GitHub y clonarlo. |
| `--remote=origin` | Registra la URL remota con el alias `origin`. |
| `--push` | Sube `main` inmediatamente. |

Salida:

```
https://github.com/Adc-alt/Adc-alt.github.io
To https://github.com/Adc-alt/Adc-alt.github.io.git
 * [new branch]      HEAD -> main
branch 'main' set up to track 'origin/main'.
```

Esa última línea es la que hace que a partir de ahora baste un `git push` a secas.

Equivalente por interfaz web, si prefieres verlo: https://github.com/new → nombre
`Adc-alt.github.io`, Public, **sin** marcar "Add a README" (chocaría con tu commit local),
y luego copiar los comandos que te da la página.

---

## Paso 5 — Activar GitHub Pages

Intenté activarlo por API:

```bash
gh api -X POST repos/Adc-alt/Adc-alt.github.io/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

```
{"message":"GitHub Pages is already enabled.", "status":"409"}
```

**Sorpresa útil: ya estaba activado.** GitHub detecta que el repo se llama
`<usuario>.github.io` y enciende Pages solo, sin que se lo pidas. Con un repo de proyecto
(cualquier otro nombre) **sí** hay que activarlo a mano.

Verificación del estado real:

```bash
gh api repos/Adc-alt/Adc-alt.github.io/pages
```

```json
{
  "status": "building",
  "html_url": "https://adc-alt.github.io/",
  "build_type": "legacy",
  "source": { "branch": "main", "path": "/" },
  "public": true,
  "https_enforced": true
}
```

Lectura de esa respuesta:

- `build_type: legacy` = modo "deploy from a branch" (no GitHub Actions). El que queremos.
- `https_enforced: true` = redirige HTTP a HTTPS automáticamente. Certificado gratis, cero configuración.
- `status: building` = el despliegue está en marcha. Aquí es donde hay que **esperar**, no tocar.

Por interfaz web es: repo → Settings → Pages → Source: "Deploy from a branch" → `main` / `/ (root)`.

---

## Paso 6 — Esperar al build (sin adivinar)

```bash
for i in 1 2 3 4 5 6 7 8 9 10; do
  st=$(gh api repos/Adc-alt/Adc-alt.github.io/pages -q .status)
  echo "intento $i: status=$st"
  [ "$st" = "built" ] && break
  sleep 10
done
```

```
intento 1: status=building
intento 2: status=building
intento 3: status=built
```

**Tardó entre 20 y 30 segundos.** Este bucle existe para no hacer lo que hace todo el mundo:
abrir la URL a los 3 segundos, ver un 404, y ponerse a "arreglar" una configuración que estaba
bien. El 404 de un sitio recién creado casi siempre es impaciencia.

---

## Paso 7 — Verificar que está vivo de verdad

```bash
curl -sSI https://adc-alt.github.io/
```

```
HTTP/2 200
server: GitHub.com
content-type: text/html; charset=utf-8
last-modified: Fri, 31 Jul 2026 12:20:11 GMT
etag: "6a6c92fb-1cf"
cache-control: max-age=600
x-github-edge-region: fra
```

Y el contenido:

```bash
curl -sS https://adc-alt.github.io/
```

Devolvió el `index.html` completo, byte por byte igual al fichero local.

Lo que dicen esas cabeceras:

- **`HTTP/2 200`** — existe y se sirve. `curl -I` pide solo la cabecera (método `HEAD`).
- **`content-type: text/html; charset=utf-8`** — el servidor dedujo el tipo por la extensión
  `.html`. Si esto dijera `text/plain`, el navegador enseñaría el código fuente en vez de la página.
- **`cache-control: max-age=600`** — 10 minutos de caché. **Esto explica por qué después de un
  push puedes seguir viendo lo viejo.** Recarga forzada con `Ctrl+Shift+R` antes de sospechar
  del deploy.
- **`x-github-edge-region: fra`** — se está sirviendo desde el nodo CDN de Frankfurt, no desde
  un servidor en EEUU. Hay una CDN entera por delante, gratis.

`curl` es la comprobación honesta: el navegador te puede estar enseñando una copia de su caché,
`curl` va a pedirlo de nuevo.

---

## Resumen de lo que costó todo esto

| Concepto | Coste |
|----------|-------|
| Software instalado | **0** (`git` y `gh` ya estaban) |
| Librerías / dependencias | **0** |
| Dinero | **0 €** |
| Ficheros de código | **1** (`index.html`, 23 líneas) |
| Tiempo de despliegue | ~25 segundos |

## Lo que queda pendiente y hay que comprobar a mano

- [ ] **Abrirlo en un navegador de verdad.** `curl` confirma que el HTML llega; no confirma que
      se vea centrado ni que la fuente del sistema cargue. Eso solo lo ve un ojo.
- [ ] **Verlo en móvil.** Es donde el `<meta viewport>` importa, y aquí nadie lo ha probado aún.

## El ciclo de trabajo a partir de ahora

```bash
# 1. editas index.html
# 2. lo abres en el navegador para verlo en local
# 3. cuando te guste:
git add -A
git commit -m "qué cambiaste"
git push
# 4. ~30 s después está en https://adc-alt.github.io/
```
