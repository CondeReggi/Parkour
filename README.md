# Parkour App

App de escritorio (Electron + React) local-first para entrenar parkour de
forma estructurada y segura.

Para una descripción completa de la arquitectura, ver `RESUMEN.txt`.

---

## Scripts

```bash
pnpm dev              # Electron en dev con HMR
pnpm build            # Build de producción de los 3 procesos
pnpm typecheck        # Web + Node
pnpm db:generate      # Regenera Prisma Client
pnpm db:deploy        # Aplica migraciones a la DB local (userData/parkour.db)
pnpm db:seed          # Carga seed inicial (idempotente)
pnpm db:studio        # Prisma Studio sobre la DB real
```

---

## Setup de Google OAuth (Sign-in con Google)

La app permite loguearse con Google para identificar al usuario.
**Funciona local sin login** — esto es opcional, pensado para futura
sincronización.

El flujo usa **Authorization Code + PKCE + loopback redirect** (sin
backend propio). El navegador del sistema se abre, el usuario aprueba,
y la app recibe el callback en un puerto local random.

### 1. Crear el cliente OAuth en Google Cloud Console

1. Entrar a https://console.cloud.google.com
2. Crear un proyecto (o usar uno existente).
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: `Parkour App` (o el que prefieras).
   - User support email: tu mail.
   - Developer contact: tu mail.
   - **Scopes**: dejar los default (la app sólo usa `openid`, `email`,
     `profile`).
   - **Test users**: agregar tu propio email (mientras la app esté en
     modo "Testing", sólo los emails listados pueden loguearse).
4. **APIs & Services → Credentials → Create Credentials → OAuth client
   ID**:
   - Application type: **Desktop app**.
   - Name: `Parkour Desktop` (o lo que quieras).
   - **No hace falta registrar Authorized redirect URIs**: el tipo
     "Desktop app" acepta cualquier `http://127.0.0.1:<puerto>/...`
     automáticamente. Esto es clave: la app levanta un servidor local
     en un puerto distinto en cada login y Google lo permite.
5. Copiar el **Client ID** y el **Client secret** del diálogo final.

> Nota sobre el "secret": Google emite un client_secret para apps tipo
> Desktop, pero su propia doc dice que "this value is not, in fact,
> treated like a secret". Sin un backend propio no hay manera de
> mantenerlo server-side. La seguridad real del flow viene de PKCE.
> El archivo `.env` está en `.gitignore`, así que el secret nunca llega
> al repo.

### 2. Configurar variables de entorno

En `.env` (en la raíz del proyecto):

```dotenv
# Pegar los valores del paso anterior.
GOOGLE_CLIENT_ID="123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
```

Si faltan, el botón "Continuar con Google" en `/settings → Cuenta`
muestra un mensaje claro pidiéndolos y la app sigue funcionando local.

### 3. Probar el login

```bash
pnpm dev
```

1. Abrir la app, ir a **Configuración → Cuenta**.
2. Tocar **Continuar con Google** → se abre el navegador del sistema.
3. Aceptar el consentimiento → el navegador muestra una pantalla
   "Sesión iniciada. Volvé a la app".
4. Volver a la app → en la card de Cuenta aparecen tu avatar, nombre,
   email y el botón "Cerrar sesión".

### 4. Llevar la app a "In production" (opcional)

Mientras el OAuth consent screen esté en modo **Testing**, sólo los
emails agregados como test users pueden loguearse. Para abrirlo a
cualquiera:

1. OAuth consent screen → **Publish app**.
2. Si los scopes son sólo `openid/email/profile` no hace falta
   verificación de Google.

---

## Local-first / persistencia

- Toda la data vive en SQLite en `app.getPath('userData')/parkour.db`:
  - Windows: `%APPDATA%/parkour-app/parkour.db`
  - macOS: `~/Library/Application Support/parkour-app/parkour.db`
  - Linux: `~/.config/parkour-app/parkour.db`
- Las migraciones se aplican con `pnpm db:deploy` (en runtime no se
  aplican solas todavía).
- El `.env` se carga al iniciar Electron (ver
  `src/main/services/envLoader.ts`).

---

## Estructura de carpetas (resumen)

```
src/
├── main/           proceso principal (Node)
│   ├── ipc/        handlers IPC por feature
│   ├── repositories/
│   ├── services/   lógica pura (auth, dataExport, streaks, etc.)
│   └── protocol/   parkour-media:// para videos y fotos
├── preload/        bridge contextBridge → window.parkourApi
├── renderer/       React app
│   ├── app/        router + providers (theme, motion, query)
│   ├── features/   una carpeta por feature
│   ├── components/ ui shadcn + motion wrappers + PageHeader
│   └── styles/     globals.css (3 temas: Urban Light / Asphalt Dark / Gotham)
└── shared/         contrato IPC (api.ts) + DTOs + Zod schemas
```

Convención fundamental: las páginas **nunca** llaman
`window.parkourApi` directo — siempre vía hooks. Cada feature define
sus queryKeys e invalida en cascada las queries afectadas.

Para más detalle ver `RESUMEN.txt`.
