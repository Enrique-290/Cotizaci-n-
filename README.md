# Facturación – UI v3 (Vite + React, demo SAT)
Incluye:
- Compras (chips y acciones)
- Facturación (formulario completo SAT-like)
- Importar CFDI (XML+PDF)
- Facturas emitidas (pago/cancelación demo)
- Reportes (desde localStorage)
- Sesión (guardar API Base/Token; compatible con backend full)

## Desarrollo
```bash
npm install
npm run dev
# abre http://localhost:5173
```

## Build
```bash
npm run build
npm run preview
```

## Despliegue en Vercel
- Nuevo proyecto → Importa este folder.
- Framework: **Vite** (auto-detectado).
- Build Command: `npm run build`
- Output Directory: `dist`
- No requiere variables de entorno.

> Si usarás el backend full, pon en la pestaña **Sesión** la API Base (ej. `http://tu-backend/api`) y usa “Crear usuario demo” + “Iniciar sesión” para obtener token.
