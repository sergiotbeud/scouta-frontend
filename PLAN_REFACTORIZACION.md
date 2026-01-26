# 🔧 Plan de Refactorización - Frontend Scouta

**Fecha de Creación:** 25 de Enero, 2026  
**Basado en:** Análisis Arquitectónico y de Calidad de Código  
**Objetivo:** Corregir problemas críticos e importantes sin reescribir el código

---

## 📊 Resumen Ejecutivo

**Problemas Identificados:** 14 (3 críticos, 4 importantes, 7 mejoras)  
**Tiempo Estimado Total:** 3-4 semanas (1 desarrollador)  
**Riesgo:** Medio (refactorización incremental, sin reescribir)  
**Prioridad:** Alta (bloquea testabilidad y escalabilidad)

---

## 🎯 Estrategia General

### Principios de Refactorización
1. **Incremental:** Un cambio a la vez
2. **Reversible:** Cada cambio debe poder revertirse
3. **Testeable:** Validar después de cada cambio
4. **Sin Breaking Changes:** Mantener funcionalidad igual
5. **Documentado:** Comentar cambios significativos

### Enfoque
- **Fase 1:** Fundamentos (Críticos) - Semana 1
- **Fase 2:** Limpieza (Importantes) - Semana 2
- **Fase 3:** Mejoras (Recomendadas) - Semana 3-4

---

## 📅 FASE 1: FUNDAMENTOS (Críticos)

**Duración:** 1 semana  
**Objetivo:** Corregir violaciones arquitectónicas críticas que impiden testear y escalar

---

### 🔴 TAREA 1.1: Implementar DI Container

**Prioridad:** CRÍTICA  
**Tiempo Estimado:** 2-3 días  
**Dependencias:** Ninguna

#### Problema
Instanciación directa de `AxiosApiClient` en 46+ lugares (use-cases, páginas, componentes).

#### Solución
1. Instalar `tsyringe` y `reflect-metadata`
2. Crear archivo de configuración de DI (`infrastructure/di/container.ts`)
3. Registrar `AxiosApiClient` como implementación de `IApiClient`
4. Crear hook `useApiClient()` que resuelve desde container
5. Reemplazar todas las instanciaciones directas

#### Archivos a Modificar
- `package.json` (agregar dependencias)
- `tsconfig.json` (habilitar decoradores)
- Crear `infrastructure/di/container.ts`
- Crear `hooks/useApiClient.ts`
- Modificar todos los use-cases (13 archivos)
- Modificar páginas que instancian directamente (10+ archivos)

#### Criterios de Éxito
- ✅ No hay instanciaciones directas de `AxiosApiClient`
- ✅ Todos los use-cases usan `useApiClient()`
- ✅ Tests pasan (si existen)
- ✅ Aplicación funciona igual que antes

#### Ejemplo de Cambio

**Antes:**
```typescript
// use-cases/useLogin.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);
```

**Después:**
```typescript
// use-cases/useLogin.ts
import { useApiClient } from '../hooks/useApiClient';

export function useLogin() {
  const apiClient = useApiClient();
  // ...
}
```

---

### 🔴 TAREA 1.2: Abstraer Acceso a Store (IAuthStore)

**Prioridad:** CRÍTICA  
**Tiempo Estimado:** 1 día  
**Dependencias:** Tarea 1.1

#### Problema
`AxiosApiClient` accede directamente a `localStorage` y conoce detalles de implementación de Zustand.

#### Solución
1. Crear interfaz `IAuthStore` en `ports/IAuthStore.ts`
2. Crear implementación `ZustandAuthStore` que implementa `IAuthStore`
3. Modificar `AxiosApiClient` para recibir `IAuthStore` como dependencia
4. Registrar `ZustandAuthStore` en DI Container
5. Inyectar `IAuthStore` en `AxiosApiClient`

#### Archivos a Crear
- `ports/IAuthStore.ts`
- `adapters/store/ZustandAuthStore.ts`

#### Archivos a Modificar
- `adapters/api/AxiosApiClient.ts` (eliminar acceso directo a localStorage)
- `infrastructure/di/container.ts` (registrar IAuthStore)

#### Criterios de Éxito
- ✅ `AxiosApiClient` no accede directamente a `localStorage`
- ✅ `AxiosApiClient` no conoce detalles de Zustand
- ✅ Se puede cambiar el store sin modificar `AxiosApiClient`
- ✅ Aplicación funciona igual que antes

#### Ejemplo de Cambio

**Antes:**
```typescript
// AxiosApiClient.ts
if (error.response?.status === 401) {
  const authStorage = localStorage.getItem('scouta-auth-storage');
  // ... manipulación directa
}
```

**Después:**
```typescript
// AxiosApiClient.ts
constructor(
  baseURL: string,
  @inject('IAuthStore') private authStore: IAuthStore
) {
  // ...
  if (error.response?.status === 401) {
    this.authStore.clearAuth();
  }
}
```

---

### 🔴 TAREA 1.3: Eliminar Acoplamiento con localStorage en AxiosApiClient

**Prioridad:** CRÍTICA  
**Tiempo Estimado:** 1 día  
**Dependencias:** Tarea 1.2

#### Problema
`AxiosApiClient` manipula directamente `localStorage` y redirige con `window.location`.

#### Solución
1. Mover lógica de redirección a `ZustandAuthStore` o crear `IRouterService`
2. `AxiosApiClient` solo debe llamar a `authStore.clearAuth()`
3. El store se encarga de limpiar localStorage y redirigir

#### Archivos a Modificar
- `adapters/api/AxiosApiClient.ts` (eliminar redirección y localStorage)
- `adapters/store/ZustandAuthStore.ts` (agregar lógica de redirección)

#### Criterios de Éxito
- ✅ `AxiosApiClient` no accede a `window.location`
- ✅ `AxiosApiClient` no accede a `localStorage`
- ✅ Redirección manejada por store o servicio dedicado
- ✅ Aplicación funciona igual que antes

---

## 📅 FASE 2: LIMPIEZA (Importantes)

**Duración:** 1 semana  
**Objetivo:** Mejorar mantenibilidad y reducir duplicación

---

### 🟠 TAREA 2.1: Dividir IApiClient en Interfaces Más Pequeñas

**Prioridad:** IMPORTANTE  
**Tiempo Estimado:** 2 días  
**Dependencias:** Fase 1 completa

#### Problema
`IApiClient` tiene 30+ métodos, violando Interface Segregation Principle.

#### Solución
1. Crear interfaces más pequeñas:
   - `IAuthClient` (login, changePassword, changeEmail)
   - `IPlayerClient` (getPlayers, createPlayer, updatePlayer, etc.)
   - `IEvaluationClient` (getEvaluations, createEvaluation, etc.)
   - `IClubClient` (getClubs, createClub, etc.)
   - `ISubscriptionClient` (getSubscription, updateSubscription, etc.)
   - `IReportClient` (generatePDF, createSharedReport, etc.)
   - `IAdminClient` (getPlayersWithoutPassword, generatePassword, etc.)
2. `AxiosApiClient` implementa todas las interfaces
3. Use-cases inyectan solo las interfaces que necesitan

#### Archivos a Crear
- `ports/IAuthClient.ts`
- `ports/IPlayerClient.ts`
- `ports/IEvaluationClient.ts`
- `ports/IClubClient.ts`
- `ports/ISubscriptionClient.ts`
- `ports/IReportClient.ts`
- `ports/IAdminClient.ts`

#### Archivos a Modificar
- `adapters/api/AxiosApiClient.ts` (implementar todas las interfaces)
- `infrastructure/di/container.ts` (registrar todas las interfaces)
- Use-cases (inyectar interfaces específicas)

#### Criterios de Éxito
- ✅ Interfaces pequeñas y cohesivas
- ✅ Use-cases solo dependen de interfaces que usan
- ✅ No hay breaking changes en funcionalidad
- ✅ Tests pasan

---

### 🟠 TAREA 2.2: Centralizar Manejo de Errores

**Prioridad:** IMPORTANTE  
**Tiempo Estimado:** 2 días  
**Dependencias:** Fase 1 completa

#### Problema
Cada use-case repite la misma lógica de manejo de errores (30+ ocurrencias de código duplicado).

#### Solución
1. Crear hook `useErrorHandler()` que centraliza lógica
2. Crear función helper `parseApiError(error: unknown): string`
3. Reemplazar manejo de errores duplicado en todos los use-cases

#### Archivos a Crear
- `hooks/useErrorHandler.ts`
- `utils/errorUtils.ts`

#### Archivos a Modificar
- Todos los use-cases (13 archivos)

#### Criterios de Éxito
- ✅ No hay código duplicado de manejo de errores
- ✅ Manejo de errores consistente en toda la app
- ✅ Fácil de mantener y extender
- ✅ Aplicación funciona igual que antes

#### Ejemplo de Cambio

**Antes:**
```typescript
catch (err: any) {
  let errorMessage = 'Error al cargar jugadores';
  if (err.message) {
    errorMessage = err.message;
  } else if (err.response?.data?.error) {
    errorMessage = err.response.data.error;
  }
  setError(errorMessage);
}
```

**Después:**
```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const { handleError } = useErrorHandler();

catch (err: unknown) {
  const errorMessage = handleError(err, 'Error al cargar jugadores');
  setError(errorMessage);
}
```

---

### 🟠 TAREA 2.3: Extraer Lógica de Negocio de Componentes

**Prioridad:** IMPORTANTE  
**Tiempo Estimado:** 1-2 días  
**Dependencias:** Fase 1 completa

#### Problema
Componentes como `NewPlayerPage` tienen lógica de negocio (subida de foto, llamadas directas a API).

#### Solución
1. Crear hook `useUploadPhoto()` para subida de fotos
2. Mover lógica de subida a use-case
3. Componentes solo manejan UI

#### Archivos a Crear
- `use-cases/useUploadPhoto.ts`

#### Archivos a Modificar
- `app/players/new/page.tsx`
- `app/players/[id]/edit/page.tsx`
- Otros componentes que suben fotos

#### Criterios de Éxito
- ✅ Componentes solo manejan UI
- ✅ Lógica de negocio en use-cases
- ✅ Código reutilizable
- ✅ Aplicación funciona igual que antes

---

### 🟠 TAREA 2.4: Crear Singleton o Factory para API Client

**Prioridad:** IMPORTANTE  
**Tiempo Estimado:** 1 día  
**Dependencias:** Tarea 1.1

#### Problema
Aunque usemos DI, necesitamos asegurar que solo hay una instancia de `AxiosApiClient` con el token actualizado.

#### Solución
1. Registrar `AxiosApiClient` como singleton en DI Container
2. Crear hook `useApiClient()` que siempre retorna la misma instancia
3. Actualizar token automáticamente cuando cambia en store

#### Archivos a Modificar
- `infrastructure/di/container.ts` (registrar como singleton)
- `hooks/useApiClient.ts` (sincronizar token con store)

#### Criterios de Éxito
- ✅ Solo una instancia de `AxiosApiClient` en memoria
- ✅ Token siempre actualizado
- ✅ No hay memory leaks
- ✅ Aplicación funciona igual que antes

---

## 📅 FASE 3: MEJORAS (Recomendadas)

**Duración:** 1-2 semanas  
**Objetivo:** Mejorar calidad de código y type safety

---

### 🟡 TAREA 3.1: Eliminar Uso de `any` (30+ ocurrencias)

**Prioridad:** RECOMENDADA  
**Tiempo Estimado:** 2-3 días  
**Dependencias:** Fase 2 completa

#### Problema
Uso extensivo de `any` en catch blocks y type assertions (30+ ocurrencias).

#### Solución
1. Reemplazar `err: any` con `err: unknown`
2. Crear type guards para errores de API
3. Usar tipos específicos en lugar de `any`

#### Archivos a Crear
- `utils/typeGuards.ts` (type guards para errores)

#### Archivos a Modificar
- Todos los use-cases (catch blocks)
- `utils/evaluationUtils.ts`
- Otros archivos con `any`

#### Criterios de Éxito
- ✅ No hay uso de `any` (excepto casos justificados)
- ✅ Type safety mejorado
- ✅ Errores de tipo detectados en compile time
- ✅ Aplicación funciona igual que antes

---

### 🟡 TAREA 3.2: Dividir Métodos Largos

**Prioridad:** RECOMENDADA  
**Tiempo Estimado:** 2 días  
**Dependencias:** Fase 2 completa

#### Problema
- `usePlayers.ts` tiene 210 líneas
- `AxiosApiClient.ts` tiene 958 líneas

#### Solución
1. Dividir `usePlayers` en hooks más pequeños:
   - `usePlayerList` (fetch, filters)
   - `usePlayerCreate`
   - `usePlayerUpdate`
   - `usePlayerDelete`
2. Dividir `AxiosApiClient` en clases especializadas o usar composición

#### Archivos a Crear
- `use-cases/usePlayerList.ts`
- `use-cases/usePlayerCreate.ts`
- `use-cases/usePlayerUpdate.ts`
- `use-cases/usePlayerDelete.ts`

#### Archivos a Modificar
- `use-cases/usePlayers.ts` (refactorizar o deprecar)
- `adapters/api/AxiosApiClient.ts` (dividir o refactorizar)

#### Criterios de Éxito
- ✅ Métodos/hooks más pequeños y enfocados
- ✅ Mejor testabilidad
- ✅ Mejor legibilidad
- ✅ Aplicación funciona igual que antes

---

### 🟡 TAREA 3.3: Agregar Validación de Respuestas del API

**Prioridad:** RECOMENDADA  
**Tiempo Estimado:** 2 días  
**Dependencias:** Fase 2 completa

#### Problema
No se valida estructura de respuestas del API, confiando en que `response.data` existe.

#### Solución
1. Crear Zod schemas para respuestas del API
2. Validar respuestas en `AxiosApiClient` o interceptor
3. Lanzar error si respuesta no coincide con schema

#### Archivos a Crear
- `schemas/apiResponses.ts` (Zod schemas)

#### Archivos a Modificar
- `adapters/api/AxiosApiClient.ts` (agregar validación)

#### Criterios de Éxito
- ✅ Respuestas validadas con Zod
- ✅ Errores detectados si API cambia
- ✅ Type safety mejorado
- ✅ Aplicación funciona igual que antes

---

### 🟡 TAREA 3.4: Agregar Tests Unitarios

**Prioridad:** RECOMENDADA  
**Tiempo Estimado:** 3-4 días  
**Dependencias:** Fase 1 completa

#### Problema
No hay tests unitarios, imposible validar refactorizaciones.

#### Solución
1. Configurar Jest + React Testing Library
2. Agregar tests para:
   - Hooks (use-cases)
   - Utilidades
   - Type guards
   - Error handlers

#### Archivos a Crear
- `jest.config.js`
- `src/__tests__/` (tests)

#### Criterios de Éxito
- ✅ Tests configurados y corriendo
- ✅ Tests para hooks principales
- ✅ Tests para utilidades
- ✅ Coverage mínimo 60%

---

### 🟡 TAREA 3.5: Mejorar Nombres de Variables

**Prioridad:** RECOMENDADA  
**Tiempo Estimado:** 1 día  
**Dependencias:** Ninguna

#### Problema
Nombres poco expresivos: `err: any`, `data: any`, `response` genérico.

#### Solución
1. Renombrar variables para ser más específicas
2. Usar tipos específicos en lugar de `any`

#### Archivos a Modificar
- Todos los use-cases
- Componentes
- Utilidades

#### Criterios de Éxito
- ✅ Nombres más descriptivos
- ✅ Código más legible
- ✅ Aplicación funciona igual que antes

---

## 📋 Checklist de Validación

### Después de Cada Tarea
- [ ] Código compila sin errores
- [ ] No hay warnings de TypeScript
- [ ] Aplicación funciona igual que antes
- [ ] Tests pasan (si existen)
- [ ] No hay regresiones

### Después de Cada Fase
- [ ] Revisar código con linter
- [ ] Ejecutar aplicación completa
- [ ] Validar flujos principales
- [ ] Documentar cambios significativos

---

## 🚀 Orden de Ejecución Recomendado

1. **Fase 1 - Tarea 1.1** (DI Container) - **CRÍTICO**
2. **Fase 1 - Tarea 1.2** (Abstraer Store) - **CRÍTICO**
3. **Fase 1 - Tarea 1.3** (Eliminar localStorage) - **CRÍTICO**
4. **Fase 2 - Tarea 2.2** (Manejo de Errores) - **IMPORTANTE** (reduce duplicación)
5. **Fase 2 - Tarea 2.1** (Dividir Interfaces) - **IMPORTANTE**
6. **Fase 2 - Tarea 2.3** (Extraer Lógica) - **IMPORTANTE**
7. **Fase 2 - Tarea 2.4** (Singleton) - **IMPORTANTE**
8. **Fase 3** (Mejoras) - **RECOMENDADO**

---

## 📝 Notas Importantes

- **No reescribir:** Refactorizar incrementalmente
- **Mantener funcionalidad:** Cada cambio debe mantener el comportamiento actual
- **Tests primero:** Agregar tests antes de refactorizar (cuando sea posible)
- **Una cosa a la vez:** Completar una tarea antes de empezar otra
- **Validar frecuentemente:** Probar después de cada cambio

---

**Fin del Plan**
