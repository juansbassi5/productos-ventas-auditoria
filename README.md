# Productos Ventas — auditoría de calidad de datos

Proyecto de la consigna «¿Qué tan confiables son nuestros datos?». Implementa el circuito completo:

```text
MongoDB Atlas → API GraphQL → Render → MCP → OpenCode / agente auditor
```

## Requisitos

- Node.js 20 o superior.
- Una base MongoDB Atlas.
- Una API key de OpenAI únicamente para obtener la explicación en lenguaje natural. La auditoría determinística funciona sin ella.

## Estructura

- `graphql-api`: Apollo Server + Express + Mongoose.
- `mcp-server`: herramientas MCP `get_products` y `update_product` por `stdio`.
- `quality-agent`: auditoría, explicación con Vercel AI SDK y correcciones con autorización.
- `opencode.json`: registro del MCP local en OpenCode.
- `render.yaml`: definición del Web Service para Render.

## 1. Instalación

Desde la raíz:

```bash
npm install
npm test
```

## 2. Configurar MongoDB Atlas

Crear `graphql-api/.env` a partir de `graphql-api/.env.example`:

```env
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/productos_ventas
PORT=4000
```

`USUARIO` es el usuario de **Database Access**, no el usuario utilizado para iniciar sesión en Atlas. Si la contraseña contiene caracteres especiales, debe codificarse para una URL.

No compartir ni versionar este archivo. Todos los `.env` están ignorados por Git.

### Cargar los datos

El seed incluye exactamente los 50 productos defectuosos de la consigna:

```bash
npm run seed
```

El comando se detiene si la colección ya contiene documentos. Para reemplazarla de forma intencional:

```bash
cd graphql-api
SEED_REPLACE=true npm run seed
```

Esta segunda variante elimina los productos existentes antes de insertarlos; usarla solamente sobre la base del ejercicio.

## 3. Ejecutar GraphQL

```bash
npm run dev:api
```

- Apollo Sandbox: <http://localhost:4000/graphql>
- Health check: <http://localhost:4000/health>
- Consultas de ejemplo: `graphql-api/examples/operations.graphql`

La API dispone de:

- `products(filter)`: listado y filtros por categoría, nombre, precio y stock.
- `product(id)`: producto individual.
- `updateProduct(id, input)`: actualización validada de precio, stock, categoría o descripción.

## 4. Probar el MCP

Crear `mcp-server/.env`:

```env
GRAPHQL_URL=https://productos-ventas-graphql.onrender.com/graphql
GRAPHQL_TIMEOUT_MS=15000
```

Con la API activa, ejecutar:

```bash
npx @modelcontextprotocol/inspector node "$PWD/mcp-server/src/index.js"
```

En el Inspector deben aparecer:

- `get_products`
- `update_product`

El servidor MCP reserva `stdout` para el protocolo y escribe diagnósticos únicamente en `stderr`.

## 5. OpenCode

`opencode.json` ya contiene la ruta absoluta de este workspace y apunta a la API local. Iniciar OpenCode desde la raíz del proyecto y verificar el servidor `productos`.

Pregunta sugerida:

```text
Usá get_products y decime qué problemas de calidad encontrás en el catálogo.
No modifiques ningún producto.
```

Al mover el proyecto a otra carpeta, actualizar la ruta absoluta de `command` en `opencode.json`.

## 6. Agente de calidad

Crear `quality-agent/.env`:

```env
GRAPHQL_URL=http://localhost:4000/graphql
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5-mini
AGENT_MAX_UPDATES=10
```

Auditoría de solo lectura:

```bash
npm run agent:audit
```

Auditoría con propuestas de corrección:

```bash
npm run agent:fix
```

El agente:

1. Obtiene los productos mediante MCP.
2. Detecta precios no positivos, stock inválido, descripciones vacías, categorías inconsistentes y nombres duplicados.
3. Utiliza el LLM solo para explicar hallazgos ya comprobados.
4. Propone automáticamente únicamente normalizaciones de categoría inequívocas.
5. Muestra valor anterior, valor propuesto y motivo.
6. Espera una respuesta `s/N` antes de cada `update_product`.
7. Ejecuta una segunda auditoría y compara resultados.

Precios, stock, descripciones y categorías desconocidas quedan para revisión humana porque corregirlos exigiría inventar información.

## 7. Deploy en Render

- Repositorio: <https://github.com/juansbassi5/productos-ventas-auditoria>
- API GraphQL: <https://productos-ventas-graphql.onrender.com/graphql>

1. Subir el repositorio a GitHub sin archivos `.env`.
2. En Render, crear el servicio usando `render.yaml` o estos valores:
   - Build: `npm ci --workspace graphql-api --include-workspace-root`
   - Start: `npm run start --workspace graphql-api`
   - Health check: `/health`
3. Agregar `MONGODB_URI` en Environment.
4. Confirmar que Atlas permite conexiones desde Render.
5. Probar `https://TU-SERVICIO.onrender.com/graphql`.
6. Cambiar `GRAPHQL_URL` en `mcp-server/.env`, `quality-agent/.env` y `opencode.json` a la URL pública.

## Comandos útiles

```bash
npm run check       # análisis sintáctico
npm test            # pruebas unitarias e integración local
npm run seed        # carga inicial de 50 productos
npm run dev:api     # API con recarga automática
npm run start:mcp   # MCP por stdio (normalmente lo inicia un cliente)
npm run agent:audit # auditoría sin escritura
npm run agent:fix   # correcciones con aprobación
```

## Seguridad

- Nunca pegar secretos en código, prompts o commits.
- Mantener `.env` fuera de Git.
- Rotar inmediatamente cualquier credencial expuesta.
- `0.0.0.0/0` en Atlas puede ser útil para el laboratorio, pero no es una configuración recomendada para producción.
- La API rechaza nuevos precios no positivos y nuevos stocks negativos.
- El agente no ejecuta ninguna actualización sin confirmación interactiva.
