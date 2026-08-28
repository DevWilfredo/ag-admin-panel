# Auditoría de integración API — AgroTrust

Fecha de revisión: 16 de agosto de 2026  
Frontend revisado: `C:\dev\projects\freelance\ag-admin-panel`  
Fuente: [Swagger de AgroTrust](https://api.agrotrust.com.ve/api-docs/#/) (`OpenAPI 3.0.0`, versión declarada `1.0.0`)  
Base URL documentada: `https://api.agrotrust.com.ve`

## Criterio

- **Integrado (código + UI), pendiente de validación real**: existe cliente HTTP y pantalla/acción, pero no se comprobó la respuesta real con sesión y datos de prueba.
- **Parcial**: existe el servicio, pero falta UI completa o el contrato usado no está documentado.
- **No integrado**: la pantalla usa mocks o no existe cliente/flujo.
- **No aplica al frontend**: integración servidor a servidor.

Las credenciales de auditoría fueron aceptadas, pero `/auth/me` devuelve el rol efectivo **`BUYER`**, no `ADMIN`. Esto permitió validar lecturas disponibles para Buyer, pero no los contratos restringidos a Admin. Swagger documenta la mayoría de los requests, pero omite el schema de respuesta de casi todas las operaciones.

## Resumen

| Estado | Operaciones | Observación |
|---|---:|---|
| Integrado en código + UI, sin validar respuesta real | 34 | Requieren smoke test autenticado por rol |
| Parcial | 5 | Servicio sin UI completa o endpoint no documentado |
| No integrado | 10 | Todos los endpoints de Analytics; la vista sigue con mocks |
| No aplica al frontend | 1 | Webhook de Terminal49 |
| **Total Swagger** | **50** | Inventario completo al 16-08-2026 |

## Inventario completo

### Auth (6)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `POST /api/auth/login` | Integrado, no validado E2E | Login visual, tokens y carga posterior de `/auth/me`. La respuesta asumida no tiene schema. |
| `POST /api/auth/logout` | Integrado, no validado E2E | Acción visual y limpieza local. Confirmar si revoca también el refresh token. |
| `GET /api/auth/me` | Integrado, no validado E2E | Restaura/protege la sesión. Falta schema. |
| `POST /api/auth/refresh` | Integrado, no validado E2E | Renovación automática ante `401`; se asumen `accessToken` y `refreshToken`. |
| `POST /api/auth/register` | Parcial | Existe `registerUser`, pero no hay UI. Confirmar si el registro público puede elegir cualquier rol, incluido `ADMIN`. |
| `GET /api/auth/users` | Integrado y validado | Directorio y selectores de participantes disponibles para Admin. `/api/users` devuelve 404. |

### Orders (4)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `GET /api/orders` | Integrado, no validado E2E | Lista, filtros y paginación solicitada al backend. Falta schema. |
| `POST /api/orders` | Integrado, no validado E2E | Modal de creación con participantes por rol. |
| `PATCH /api/orders/{id}/advance` | Integrado, no validado E2E | Acción para avanzar etapa y enviar notas. |
| `GET /api/orders/{id}/audit` | Integrado, no validado E2E | Timeline en detalle de transacción. Falta schema. |

`GET /api/orders/{id}` no aparece en Swagger y la API real devolvió `404 Route not found`. Se eliminó esa llamada del frontend; Transactions usa ahora el objeto completo devuelto por `GET /api/orders`.

### Warehouses (5)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `GET /api/warehouses` | Integrado, no validado E2E | Tabla visual. |
| `POST /api/warehouses` | Integrado, no validado E2E | Alta visual; falta selector de `keeperId`. |
| `PUT /api/warehouses/{id}` | Integrado, no validado E2E | Edición visual; falta edición de `keeperId`. |
| `DELETE /api/warehouses/{id}` | Integrado, no validado E2E | Confirmación y eliminación. |
| `GET /api/warehouses/{id}` | Parcial | Existe servicio, pero ninguna pantalla lo consume. |

### Vessels (7)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `POST /api/vessels` | Integrado, no validado E2E | Asignación desde Transactions. |
| `GET /api/vessels/order/{orderId}` | Integrado, no validado E2E | Detalle, ETA y posición; el adaptador tolera formas no documentadas. |
| `PUT /api/vessels/order/{orderId}` | Integrado, no validado E2E | Edición visual. |
| `GET /api/vessels/order/{orderId}/logs` | Integrado, no validado E2E | Historial y mapa; response no documentado. |
| `POST /api/vessels/order/{orderId}/retry` | Integrado, no validado E2E | Reintento de Terminal49. |
| `PATCH /api/vessels/order/{orderId}/position` | Integrado, no validado E2E | Actualización manual y mapa. |
| `POST /api/vessels/webhook` | No aplica | Terminal49 llama este endpoint; no debe invocarlo el navegador. |

### Payments (6)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `POST /api/payments` | Integrado, no validado E2E | Alta visual. |
| `PATCH /api/payments/order/{orderId}/sent` | Integrado, no validado E2E | Acción “Mark sent”. |
| `PATCH /api/payments/order/{orderId}/received` | Integrado, no validado E2E | Acción “Mark received”. |
| `PATCH /api/payments/order/{orderId}/distribute` | Integrado, no validado E2E | Distribución; Swagger documenta parcialmente `settlement`. |
| `GET /api/payments/order/{orderId}` | Integrado, no validado E2E | Panel por orden. |
| `GET /api/payments/lender/history` | Integrado, no validado E2E | “Lender portfolio”; el error se oculta y debe diferenciar rol de fallo real. |

### Inventory (6)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `GET /api/inventory` | Integrado, no validado E2E | Tabla; filtros disponibles en servicio, no en UI. |
| `POST /api/inventory` | Integrado, no validado E2E | Alta visual. |
| `PATCH /api/inventory/{id}/custody` | Integrado, no validado E2E | Actualización visual. |
| `POST /api/inventory/{id}/photos` | Integrado, no validado E2E | Carga múltiple. Confirmar campo multipart `photos`, límites y tipos. |
| `POST /api/inventory/{id}/receipt` | Integrado, no validado E2E | Emisión visual. |
| `GET /api/inventory/order/{orderId}` | Parcial | Existe servicio, pero ninguna pantalla lo consume. |

### Documents (6)

| Método y ruta | Estado | Integración actual / pendiente |
|---|---|---|
| `POST /api/documents` | Integrado, no validado E2E | Upload multipart con tipos coincidentes. |
| `GET /api/documents/order/{orderId}` | Integrado, no validado E2E | Lista por orden. |
| `GET /api/documents/checklist/{orderId}` | Integrado, no validado E2E | Checklist en Transactions; response parcialmente tipado en Swagger. |
| `PATCH /api/documents/{id}/status` | Integrado, no validado E2E | Modal; la UI no restringe por rol y depende del `403`. |
| `DELETE /api/documents/{id}` | Integrado, no validado E2E | Eliminación; la UI no oculta la acción para no-admin. |
| `GET /api/documents/{id}` | Parcial | Existe servicio, pero la UI abre el `fileUrl` obtenido del listado. |

### Analytics (10)

Los diez endpoints están **no integrados**. `app/data-analytics/page.tsx` carga `getDataAnalyticsMockState`; no existe `analytics-service` ni adaptación de responses reales. Todos devolvieron `403 Access denied` porque la credencial configurada corresponde a un `BUYER`.

| Método y ruta | Bloqueo |
|---|---|
| `GET /api/analytics/operations/summary` | Sin response schema. |
| `GET /api/analytics/operations/timeline/{orderId}` | Sin schema ni selector/detalle visual. |
| `GET /api/analytics/operations/cycle-duration` | Sin schema, unidades ni formato. |
| `GET /api/analytics/operations/shipment-status` | Sin schema ni categorías. |
| `GET /api/analytics/operations/execution-efficiency` | Sin schema ni unidades. |
| `GET /api/analytics/flow/capital` | Sin schema, moneda ni periodo. |
| `GET /api/analytics/flow/geographic` | Sin schema ni significado de porcentajes/volúmenes. |
| `GET /api/analytics/flow/payment-timing` | Sin schema ni buckets. |
| `GET /api/analytics/flow/volume-over-time` | Sin schema, unidad ni rango temporal. |
| `GET /api/analytics/market/commodity-exposure` | Sin schema, moneda ni unidad. |

La vista mock contiene además **Price Evolution**, pero Swagger no ofrece un endpoint equivalente. Debe eliminarse, mantenerse como fuente externa claramente indicada o respaldarse con un nuevo contrato de backend.

## Dudas necesarias para cerrar

1. Sustituir las credenciales actuales por credenciales realmente `ADMIN`: las configuradas autentican correctamente, pero `/auth/me` devuelve `BUYER`. Después serán necesarias credenciales de los demás roles para validar la matriz completa.
2. Schemas y ejemplos de respuestas/errores, especialmente Auth, Users, Orders, Warehouses, Vessels y Analytics.
3. Confirmar que `GET /api/orders` seguirá devolviendo los campos suficientes para el detalle, ya que `GET /api/orders/{id}` devuelve `404` y fue retirado del frontend.
4. ¿Logout invalida access y refresh token?
5. ¿Quién puede registrar usuarios, qué roles asigna y la UI debe ser pública o administrativa?
6. Matriz de permisos por rol para cada operación; `bearerAuth` no expresa autorización.
7. Contrato exacto de Analytics y decisión sobre Price Evolution.
8. Formatos, tamaño máximo y cantidad para fotos/documentos; privacidad/expiración de `fileUrl`.
9. Reglas y precondiciones entre Inventory, Documents, Vessels, Payments y las 12 transiciones.
10. Envoltura estándar de listados (`{ data, pagination }`, `{ orders, pagination }`, array, etc.).

## Validación local

- `git diff --check`: sin errores de whitespace; sólo avisos LF/CRLF.
- TypeScript: aprobado con `tsc --noEmit`.
- ESLint: aprobado sobre `services`, `features`, `components`, `app` y `next.config.ts`.
- Build de producción Next.js: aprobado; 11 páginas generadas correctamente.
- Smoke test local: `200 OK` y encabezados CSP, `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff` confirmados.
- No se ejecutaron mutaciones contra la API sin credenciales ni autorización sobre datos de prueba.
- La sesión real confirmó `GET /auth/me`, `GET /orders`, `GET /orders/{id}/audit`, `GET /warehouses`, Vessels y el checklist. `GET /users` devolvió `404`; Analytics y lender history devolvieron `403` para el rol Buyer.

## Cierre funcional y de seguridad para BUYER

- `/auth/me` es la fuente del rol para cada entrada a una ruta protegida. El rol guardado en `sessionStorage` ya no decide navegación ni acciones.
- El usuario confirmado por backend se mantiene en un contexto React durante la vista. Manipular el valor almacenado desde la consola no eleva capacidades.
- Analytics está fuera del sidebar para Buyer y `/data-analytics` exige `view:analytics`; un acceso directo redirige al dashboard.
- Messages fue retirado de la navegación porque no existe ruta ni endpoint contractual.
- Buyer conserva las lecturas que la API permitió: Dashboard basado en Orders/Audit, Transactions, Warehouses, Inventory, Documents y Payments por orden.
- El Dashboard dejó de mostrar métricas, notificaciones, mensajes y gráficos mock como si fueran reales. Sólo muestra datos derivados de Orders/Audit y marca como restringida o no disponible la información que requiere Analytics.
- Se ocultan para Buyer: creación de órdenes; alta/edición/borrado de almacenes; gestión de inventario; asignación/reintento/posición manual de buques; creación y transición de pagos; estado y borrado de documentos; historial de Lender.
- Upload de documentos permanece visible porque Swagger define permisos por tipo, pero no publica la matriz exacta. Backend debe rechazar con `403` los tipos no permitidos; falta esa matriz para filtrar el selector previamente.
- Advance Order permanece visible porque Swagger no lo marca “Admin only”. La prueba con UUID inexistente devolvió `404`, no `403`; no se probó con la orden real para evitar alterar su etapa.
- Pruebas negativas con cuerpos inválidos/UUID inexistente confirmaron `403` para Warehouses, creación de Orders, Payments, Vessels, Inventory y actualización de estado documental.
- Se añadieron CSP, protección anti-iframe, `nosniff`, política de referrer y Permissions Policy.

### Límite de seguridad obligatorio

Ocultar botones o validar un contexto en React no es autorización. Un usuario puede construir peticiones HTTP fuera de la interfaz. La protección real debe permanecer en el backend, validando el JWT, el rol y la pertenencia de cada recurso en **todas** las rutas. Para reducir el impacto de XSS, el siguiente endurecimiento recomendado requiere soporte backend: mover refresh/access tokens a cookies `HttpOnly`, `Secure` y `SameSite`, aplicar rotación/revocación y evitar tokens persistentes accesibles a JavaScript.

## Actualización ADMIN — 16 de agosto de 2026

- La nueva cuenta fue confirmada por `GET /api/auth/me` como rol efectivo `ADMIN`.
- Los diez endpoints de Analytics responden `200` y sustituyen completamente los gráficos mock. Operations, Flow y Market consumen ahora datos reales.
- `GET /api/analytics/operations/timeline/{orderId}` alimenta una cronología por orden dentro de Operations.
- “Price Evolution” fue retirado de la vista real porque Swagger no publica ninguna fuente para esos datos.
- Se añadió el módulo visual Users y la creación mediante `POST /api/auth/register`. Una prueba no destructiva con un correo duplicado confirmó el error contractual `400 Email already registered`.
- **Desfase resuelto:** `GET /api/users` devuelve `404`, pero `GET /api/auth/users` responde correctamente con JWT ADMIN y alimenta el directorio y los selectores.
- El CRUD completo de Warehouses fue validado con un almacén temporal: crear, actualizar, consultar por ID y eliminar devolvieron `200`; el recurso temporal fue eliminado al terminar.
- Los GET administrativos de órdenes, auditoría, almacenes, inventario, pagos, documentos, checklist, buques y logs fueron revalidados con respuestas reales.
- No se avanzó ni eliminó la orden existente. Tampoco se crearon pagos, inventario o documentos sobre ella, porque esos recursos no tienen una eliminación/restauración segura equivalente.
- Se añadieron pruebas E2E ADMIN para navegación, permisos, formularios y las tres áreas de Analytics, sin enviar mutaciones.

## Próximo paso seguro

## Flujo de demostración Buyer + Admin

- Orden: `TS-2026-3562` (`Arabica Coffee - Demo`, 12.500 kg, Venezuela → Netherlands).
- Usa los participantes reales de la orden inicial, por lo que el Buyer existente puede verla mediante el filtrado normal del backend.
- Tiene inventario, warehouse receipt, los diez documentos requeridos, pago por USD 87.500 y auditoría completa de las doce etapas.
- El pago quedó en `SETTLED` y la orden en `FUNDS_DISTRIBUTED`.
- Buque: `AGROTRUST DEMO VESSEL`; posición manual demo en Puerto Cabello, coordenadas `10.4806, -68.0072`, ETA 5 de septiembre de 2026.
- Terminal49 no acepta el Bill of Lading ficticio. Cuando existen coordenadas manuales y el proveedor marca el tracking como fallido, el frontend muestra `MANUAL_POSITION` para diferenciar claramente el mapa administrativo de tracking satelital.
- Buyer ve su checklist filtrado de 8/8 documentos; Admin ve el checklist completo 10/10. Ambos ven el mapa, pago y lifecycle; sólo Admin ve los controles de tracking.
- Dos E2E dedicados verifican el recorrido completo desde ambos roles sin volver a mutar los datos.
- El detalle integra ahora Vessel Tracker y Warehouse Tracker usando coordenadas reales del vessel y del warehouse enlazado mediante Inventory.
- Los checkpoints con ubicación respaldada muestran un preview interactivo: Inventory/Receipt/Collateral usan warehouse; B/L/Transit/Shipping Documents usan vessel. Las etapas sin coordenadas no inventan mapas.
- Los botones sobre mapas siguen el componente glassmorphism del Figma: fondo translúcido, `backdrop-filter: blur`, borde/brillo blanco, sombra interna y acción circular con flecha.

Cerrar primero las dudas 1–7. Con ejemplos reales de Analytics se puede sustituir el mock por un `analytics-service`, adaptar los diez responses a los gráficos y añadir estados de carga/error/rol sin inventar contratos. Después debe ejecutarse una matriz de smoke tests por rol y endpoint antes de declarar la integración lista.
