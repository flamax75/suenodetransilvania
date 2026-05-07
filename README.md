# Sueño de Transilvania

Web oficial del proyecto musical Sueño de Transilvania, creado por Maxim Capalnas Flaviu. El sitio presenta canciones originales, letras, historias, información del proyecto, contacto y enlaces a canales oficiales.

## Estructura

- `index.html`: página principal con videoclips, letras e historias.
- `quien.html`: presentación del proyecto y galería.
- `contacto.html`: correo y redes oficiales.
- `politica.html`: privacidad, cookies y derechos de autor.
- `style.css`: estilos globales y responsive.
- `main.js`: interacción de canciones, año del footer, banner de instalación y registro del service worker.
- `service-worker.js`: caché PWA básica.
- `manifest.json`: configuración de instalación como app.
- `test/site.test.js`: comprobaciones automáticas de enlaces, assets, manifest, service worker y `toggleSection`.

## Desarrollo local

Abre `index.html` directamente en el navegador para revisar la web. Para probar el service worker/PWA, sirve la carpeta desde un servidor local.

## Tests

```bash
npm test
```

Los tests usan el runner nativo de Node, sin dependencias externas.

## Checklist antes de publicar

- Ejecutar `npm test`.
- Revisar que todos los enlaces internos funcionan.
- Comprobar la vista móvil.
- Optimizar imágenes nuevas antes de subirlas.
- Actualizar `sitemap.xml` si se añaden páginas.