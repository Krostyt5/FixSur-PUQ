# FixSur — cómo llevar el código a GitHub

Esta carpeta contiene **todo el código de la aplicación**, lista para subir.
No incluye las dependencias (se instalan con un comando) ni los datos de acceso
a la base de datos (esos son privados y hay que configurarlos aparte).

---

## 1. Probar la app en tu computador

Necesitas **Node.js 20 o superior** ([nodejs.org](https://nodejs.org)).

```bash
cd FixSur
npm install     # instala las dependencias (tarda 1-2 minutos)
cp .env.example .env
npm run dev     # abre la app en http://localhost:8080
```

> Sin un archivo `.env` con datos reales, la app no podrá iniciar sesión ni
> guardar órdenes: solo mostrará las pantallas.

---

## 2. Subir a GitHub

Primero crea un repositorio **vacío** en GitHub (sin README ni .gitignore),
copiando la dirección que te da GitHub. Luego:

```bash
cd FixSur
git init
git add .
git commit -m "FixSur: soporte tecnológico para el hogar en Magallanes"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

Si ya tienes el repositorio clonado en tu computador, basta con copiar el
contenido de esta carpeta dentro de él y hacer `git add`, `git commit` y
`git push`.

---

## 3. La base de datos (lo más importante)

El código **no** viaja con la base de datos. Las órdenes, clientes, técnicos,
roles y cuentas viven en el servicio en la nube.

Para que la app funcione en otro lado necesitas:

1. **Un proyecto de base de datos** (puede ser el mismo de Lovable Cloud, un
   proyecto propio de Supabase, u otro compatible con Postgres).
2. **Aplicar las migraciones SQL** que están en `drizzle/migrations/`:
   - `0000_migration.sql` — tablas, permisos y reglas de seguridad
   - `0001_migration.sql` — el primer registro se convierte en administrador
   - `0002_order_payment.sql` — forma de pago y total en cada orden
3. **Los datos de acceso** en `.env` (usa `.env.example` como plantilla).
4. **Proveedores de ingreso** activos: correo y Google.

Sin esos pasos, la app se ve pero no inicia sesión.

---

## 4. Publicar en internet

El proyecto está preparado para **Cloudflare Workers**. Con una cuenta gratuita
de Cloudflare:

```bash
npm run build
npx wrangler deploy
```

También sirve cualquier hosting que corra Node.js: `npm run build` y luego
`npm run preview`, o subir la carpeta `dist` a tu proveedor.

En GitHub puedes activar **GitHub Actions** para que cada `git push` publique
solo. Si quieres, te preparo ese archivo de automatización.

---

## 5. La forma más fácil: sincronizar desde Lovable

Si sigues editando la app en Lovable, no hace falta repetir esto a mano. En
**Project settings → Git** se conecta un repositorio de GitHub y cada cambio
queda commiteado y empujado automáticamente, y los cambios que hagas en GitHub
vuelven a Lovable.

La descarga de esta carpeta es la opción para cuando quieres el código en tus
manos, fuera de Lovable.

---

## Estructura del proyecto

| Ruta | Qué contiene |
| --- | --- |
| `src/routes/` | Las páginas: inicio, agendar, mi hogar, técnico, central, ingreso |
| `src/lib/` | Reglas de agendamiento, tarifas, formas de pago, datos compartidos |
| `src/components/` | Piezas de interfaz (selectores, resumen, QR, avisos) |
| `src/integrations/` | Conexión con la base de datos y con el ingreso con Google |
| `drizzle/migrations/` | Las órdenes SQL que crean la base de datos |
| `public/` | Ícono de la pestaña y archivo para buscadores |

## Comandos útiles

```bash
npm run dev       # editar con la app abierta
npm run build     # generar la versión para publicar
npm run lint      # revisar el código
npm run format    # ordenar el formato del código
```
