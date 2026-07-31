# Adc-alt.github.io

Mi portfolio. Sitio estático, sin build, sin dependencias.

**En vivo:** https://adc-alt.github.io/

## Estructura

```
.
├── index.html   ← la página entera
├── .nojekyll    ← le dice a GitHub Pages que no procese nada, solo sirva los ficheros
└── docs/        ← cómo está hecho esto y por qué (aprendizaje)
```

## Cómo verlo en local

Abre `index.html` en el navegador. Literalmente doble clic. No hace falta servidor.

Si prefieres un servidor de verdad (necesario más adelante, cuando haya varias páginas o `fetch`):

```bash
python3 -m http.server 8000   # luego http://localhost:8000
```

## Cómo publicar un cambio

```bash
git add -A && git commit -m "lo que sea" && git push
```

GitHub Pages redespliega solo en ~30 segundos.

## Documentación de aprendizaje

Empieza por [`docs/README.md`](docs/README.md).
