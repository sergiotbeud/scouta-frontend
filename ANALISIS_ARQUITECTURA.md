# 📊 Análisis Arquitectónico y de Calidad de Código - Frontend Scouta

**Fecha:** 25 de Enero, 2026  
**Analista:** Senior Software Architect + Code Reviewer  
**Proyecto:** Scouta Frontend - Sistema de Evaluación de Jugadores

---

## 📋 1. Comprensión del Proyecto

### 1.1 Propósito General
Frontend de sistema SaaS para evaluación y análisis de rendimiento de jugadores de fútbol mediante métricas técnicas, tácticas, físicas, cognitivas, psicológicas y biomédicas.

### 1.2 Arquitectura Declarada vs Real

**Arquitectura Declarada:**
- Next.js 14 con estructura similar a Hexagonal

**Arquitectura Real Detectada:**
- **Frontend**: Estructura modular pero **sin separación clara de capas**
- **Violaciones**: Instanciación directa de dependencias, acoplamiento fuerte con implementaciones concretas

### 1.3 Stack Tecnológico
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estado Global**: Zustand
- **Formularios**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Estilos**: Tailwind CSS

### 1.4 Dependencias Clave y Acoplamientos Detectados

**Dependencias Críticas:**
1. **AxiosApiClient** → Instanciado directamente en 46+ lugares (violación de arquitectura)
2. **localStorage** → Accedido directamente desde AxiosApiClient (acoplamiento fuerte)
3. **Zustand Store** → Usado directamente en componentes y use-cases
4. **Next.js Router** → Acoplamiento fuerte en use-cases

**Acoplamientos Problemáticos:**
- Use-cases → AxiosApiClient concreto (debería ser IApiClient)
- Páginas/Componentes → AxiosApiClient concreto
- AxiosApiClient → localStorage directo (debería ser abstracción)
- Use-cases → Zustand directo (debería ser abstracción)

---

## 🏗️ 2. Análisis de Arquitectura

### 2.1 Problemas Arquitectónicos Críticos

#### 🔴 **CRÍTICO 1: Violación Masiva de Inversión de Dependencias (DIP)**

**Ubicación:** 46+ archivos (use-cases, páginas, componentes)

**Problema:**
```typescript
// frontend/use-cases/useLogin.ts:8
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);
```

**Impacto:**
- Imposible testear use-cases sin mockear AxiosApiClient globalmente
- Imposible cambiar implementación de API client (ej: Fetch API, React Query)
- Acoplamiento fuerte con Axios
- Violación del principio DIP (SOLID)
- Cada use-case crea su propia instancia (46 instancias)

**Archivos Afectados:**
- Todos los `use-cases/*.ts` (13 archivos)
- Múltiples páginas en `app/**/*.tsx` (10+ archivos)
- Componentes como `SuperAdminDashboard.tsx`

#### 🔴 **CRÍTICO 2: Acoplamiento Directo con localStorage en AxiosApiClient**

**Ubicación:** `frontend/adapters/api/AxiosApiClient.ts:68-83`

**Código Problemático:**
```typescript
// Interceptor para manejar errores 401 (token expirado)
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ❌ Acceso directo a localStorage
      const authStorage = localStorage.getItem('scouta-auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          parsed.state.token = null;
          parsed.state.user = null;
          parsed.state.isAuthenticated = false;
          localStorage.setItem('scouta-auth-storage', JSON.stringify(parsed));
        } catch (e) {
          localStorage.removeItem('scouta-auth-storage');
        }
      }
    }
  }
);
```

**Problema:**
- AxiosApiClient conoce detalles de implementación de Zustand
- Imposible cambiar el store sin modificar AxiosApiClient
- Violación de separación de responsabilidades
- Imposible testear en Node.js (localStorage no existe)

#### 🟠 **IMPORTANTE 3: Interfaz IApiClient Demasiado Grande (Violación ISP)**

**Ubicación:** `frontend/ports/IApiClient.ts`

**Problema:**
- **30+ métodos** en una sola interfaz
- Cualquier clase que implemente IApiClient debe implementar TODOS los métodos
- Violación del principio Interface Segregation (SOLID)
- Difícil de mantener y extender

**Métodos en IApiClient:**
- Autenticación (3 métodos)
- Jugadores (8 métodos)
- Evaluaciones (6 métodos)
- Templates (5 métodos)
- Clubes (6 métodos)
- Suscripciones (4 métodos)
- Evaluadores (5 métodos)
- Reportes (4 métodos)
- Admin (2 métodos)

**Solución:**
Dividir en interfaces más pequeñas:
- `IAuthClient`
- `IPlayerClient`
- `IEvaluationClient`
- `IClubClient`
- `IReportClient`
- etc.

#### 🟠 **IMPORTANTE 4: Manejo de Errores Duplicado y Inconsistente**

**Ubicación:** Todos los use-cases

**Problema:**
Cada use-case repite la misma lógica de manejo de errores:

```typescript
// usePlayers.ts:40-59
catch (err: any) {
  let errorMessage = 'Error al cargar jugadores';
  
  if (err.message) {
    errorMessage = err.message;
  } else if (err.response?.data?.error) {
    errorMessage = err.response.data.error;
  } else if (err.request) {
    errorMessage = 'No se pudo conectar con el servidor...';
  }
  
  setError(errorMessage);
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error en fetchPlayers (catch):', {...});
  }
}
```

**Impacto:**
- Código duplicado en 13+ archivos
- Difícil mantener consistencia
- Cambios requieren modificar múltiples archivos
- Violación de DRY (Don't Repeat Yourself)

**Solución:**
Crear un `ErrorHandler` centralizado o un hook `useErrorHandler`.

#### 🟠 **IMPORTANTE 5: Lógica de Negocio en Componentes/Páginas**

**Ubicación:** `app/players/new/page.tsx:18, 206`

**Código Problemático:**
```typescript
// ❌ Instanciación directa en componente
const apiClient = new AxiosApiClient(API_URL);

// ❌ Lógica de negocio en componente
const onSubmit = async (data: PlayerFormData) => {
  if (photoFile) {
    if (token) {
      apiClient.setToken(token);
    }
    const uploadResponse = await apiClient.uploadPlayerPhoto(photoFile);
    // ...
  }
};
```

**Problema:**
- Componente tiene responsabilidades múltiples (UI + lógica de negocio)
- Imposible reutilizar lógica de subida de foto
- Violación de SRP (Single Responsibility Principle)

**Solución:**
Extraer a un use-case `useUploadPhoto` o método en `usePlayers`.

---

## 🧹 3. Análisis de Clean Code

### 3.1 Métodos Largos

#### 🟠 **LARGO 1: usePlayers.ts (210 líneas)**

**Problema:**
- Un solo hook con 6 funciones (fetchPlayers, createPlayer, updatePlayer, deletePlayer, fetchDeletedPlayers, restorePlayer)
- Cada función tiene manejo de errores duplicado
- Difícil de testear
- Difícil de mantener

**Solución:**
Dividir en hooks más pequeños o extraer lógica común.

#### 🟠 **LARGO 2: AxiosApiClient.ts (958 líneas)**

**Problema:**
- Clase monolítica con 30+ métodos
- Difícil de navegar
- Difícil de mantener
- Violación de SRP

**Solución:**
Dividir en múltiples clases especializadas o usar composición.

### 3.2 Uso Excesivo de `any`

**Ubicación:** 30+ ocurrencias en use-cases y utils

**Ejemplos:**
```typescript
// usePlayers.ts:40
catch (err: any) {
  // ...
}

// evaluationUtils.ts:36-39
if ('value' in value && typeof (value as any).value === 'number') {
  value = (value as any).value;
}
```

**Impacto:**
- Pérdida de type safety
- Errores en runtime
- Dificulta refactorización

**Solución:**
Usar tipos específicos o `unknown` con type guards.

### 3.3 Nombres Poco Expresivos

**Ejemplos:**
- `err: any` → debería ser `error: unknown` o tipo específico
- `data: any` → debería ser `CreatePlayerRequest` o tipo específico
- `response` → en algunos contextos debería ser `apiResponse` o `loginResponse`

### 3.4 Duplicación de Código

#### 🟡 **DUPLICACIÓN 1: Instanciación de API Client**

**Ubicación:** 46+ archivos

```typescript
// Repetido en cada archivo
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiClient = new AxiosApiClient(API_URL);
```

**Solución:**
Crear factory o usar DI Container.

#### 🟡 **DUPLICACIÓN 2: Manejo de Token en use-cases**

**Ubicación:** Todos los use-cases

```typescript
// Repetido en cada use-case
useEffect(() => {
  if (token) {
    apiClient.setToken(token);
  }
}, [token]);
```

**Solución:**
Extraer a hook `useApiClient` o middleware.

---

## 🎯 4. Principios SOLID

### 4.1 Single Responsibility Principle (SRP)

#### ❌ **VIOLACIÓN 1: AxiosApiClient**

**Problema:**
- Maneja HTTP requests
- Maneja autenticación (token)
- Maneja localStorage (limpieza de auth)
- Maneja redirección (window.location)
- Maneja parsing de errores

**Solución:**
Separar en:
- `HttpClient` (solo HTTP)
- `AuthInterceptor` (manejo de token)
- `AuthService` (manejo de auth state)

#### ❌ **VIOLACIÓN 2: usePlayers**

**Problema:**
- Fetch de jugadores
- Creación de jugadores
- Actualización de jugadores
- Eliminación de jugadores
- Restauración de jugadores
- Manejo de errores
- Manejo de loading state

**Solución:**
Dividir en hooks más pequeños o usar composición.

### 4.2 Open/Closed Principle (OCP)

#### ✅ **CUMPLE**
- Interfaces permiten extensión (IApiClient)
- Componentes son extensibles mediante props

### 4.3 Liskov Substitution Principle (LSP)

#### ✅ **CUMPLE**
- No hay herencia problemática detectada

### 4.4 Interface Segregation Principle (ISP)

#### ❌ **VIOLACIÓN: IApiClient**

**Problema:**
- Interfaz con 30+ métodos
- Cualquier implementación debe implementar todos
- Violación de ISP

**Solución:**
Dividir en interfaces más pequeñas y específicas.

### 4.5 Dependency Inversion Principle (DIP)

#### ❌ **VIOLACIÓN MASIVA**

**Problema:**
- Use-cases dependen de `AxiosApiClient` concreto
- Componentes dependen de `AxiosApiClient` concreto
- No hay abstracción ni inyección de dependencias

**Solución:**
- Implementar DI Container (tsyringe o similar)
- Inyectar `IApiClient` en lugar de instanciar `AxiosApiClient`

---

## 🔍 5. Errores de Sintaxis y Flujo

### 5.1 Type Safety

#### 🟡 **PROBLEMA 1: Uso de `any` en Catch Blocks**

**Ubicación:** 30+ ocurrencias

**Riesgo:**
- Errores en runtime si se accede a propiedades que no existen
- Pérdida de type safety

**Solución:**
```typescript
// ❌ Actual
catch (err: any) {
  setError(err.message);
}

// ✅ Debería ser
catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Error desconocido';
  setError(message);
}
```

### 5.2 Manejo de Errores

#### 🟠 **PROBLEMA: Inconsistencia en Manejo de Errores**

**Ejemplos:**
- Algunos use-cases retornan `null` en error
- Otros retornan `false` en error
- Algunos lanzan excepciones
- Otros solo setean `error` state

**Solución:**
Estandarizar con `Result<T, E>` pattern o error handling centralizado.

---

## 🔄 6. Análisis del Flujo del Sistema

### 6.1 Flujo Principal de Ejecución

#### Flujo de Login:
```
1. Usuario → LoginForm component
2. LoginForm → useLogin hook
3. useLogin → AxiosApiClient.login() (instancia directa)
4. AxiosApiClient → Backend API
5. Response → useLogin → Zustand store (setAuth)
6. Zustand → localStorage (persist)
7. useLogin → Next.js router.push('/dashboard')
```

**Problemas Detectados:**
- ✅ Flujo relativamente limpio
- ⚠️ Instanciación directa de AxiosApiClient
- ⚠️ Acoplamiento con Zustand directo

#### Flujo de Creación de Jugador:
```
1. Usuario → NewPlayerPage component
2. NewPlayerPage → usePlayers hook (fetchPlayers, createPlayer)
3. usePlayers → AxiosApiClient (instancia directa)
4. NewPlayerPage → AxiosApiClient.uploadPlayerPhoto() (instancia directa) ❌
5. AxiosApiClient → Backend API
6. Response → usePlayers → Actualizar estado local
```

**Problemas:**
- 🔴 Llamada directa a API desde componente (línea 206)
- 🟠 Instanciación directa de AxiosApiClient
- 🟡 Falta de transaccionalidad (upload foto + crear jugador)

### 6.2 Puntos Frágiles

#### 🔴 **FRÁGIL 1: Múltiples Instancias de AxiosApiClient**

**Problema:**
- 46+ instancias de `AxiosApiClient` en memoria
- Cada una mantiene su propio estado de token
- Posible inconsistencia si token cambia

**Riesgo:**
- Token desactualizado en algunas instancias
- Memory leak potencial

**Solución:**
Singleton o DI Container con instancia única.

#### 🟠 **FRÁGIL 2: Manejo de Token en Múltiples Lugares**

**Problema:**
- Token se setea en cada use-case con `useEffect`
- Token se setea manualmente en componentes
- Posible race condition

**Solución:**
Interceptor automático o hook centralizado.

#### 🟡 **FRÁGIL 3: Falta de Validación de Respuestas**

**Problema:**
- No se valida estructura de respuestas del API
- Se confía en que `response.data` existe
- Posible error en runtime si API cambia

**Solución:**
Validar con Zod schemas.

---

## 📊 7. Diagramas

### 7.1 Diagrama de Dependencias Actual (Problemático)

```
┌─────────────────────────────────────────────────────────┐
│                    Pages/Components                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │NewPlayerPage │  │LoginForm     │  │Dashboard     │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼─────────────────┼──────────┘
          │                 │                 │
          │  ❌ VIOLACIÓN: Instanciación directa
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────┐
│                    Use Cases                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │usePlayers    │  │useLogin      │  │useEvaluations│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼─────────────────┼──────────┘
          │                 │                 │
          │  ❌ VIOLACIÓN: Instanciación directa
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────┐
│              Adapters (Implementations)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │         AxiosApiClient (46+ instancias)            │ │
│  │  ❌ Acceso directo a localStorage                  │ │
│  │  ❌ Manejo de redirección                           │ │
│  └──────┬─────────────────────────────────────────────┘ │
└─────────┼──────────────────────────────────────────────┘
          │
          │  ❌ VIOLACIÓN: No usa interfaz IApiClient
          │
┌─────────▼──────────────────────────────────────────────┐
│              Infrastructure                            │
│                    Axios                                │
│                    localStorage                        │
│                    window.location                     │
└────────────────────────────────────────────────────────┘

LEGENDA:
✅ = Correcto según arquitectura
❌ = Violación de arquitectura
→ = Dependencia
```

### 7.2 Diagrama de Flujo - Creación de Jugador (Problemático)

```
┌─────────────┐
│   Usuario   │
│  Completa   │
│   Formulario│
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│    NewPlayerPage Component        │
│  ┌────────────────────────────┐  │
│  │ ❌ new AxiosApiClient()    │  │ ← Instancia directa
│  │ ❌ apiClient.uploadPhoto() │  │ ← Lógica en componente
│  │ ✅ usePlayers()            │  │
│  └──────────┬─────────────────┘  │
└──────────────┼────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│usePlayers   │  │AxiosApiClient│
│  ┌────────┐ │  │(instancia 1) │
│  │new     │ │  └──────┬───────┘
│  │AxiosApi│ │         │
│  │Client()│ │         │
│  └───┬────┘ │         │
└───────┼─────┘         │
        │               │
        │  ❌ Nueva instancia
        │               │
        └───────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  Backend API  │
         └──────────────┘
```

---

## 📝 8. Listado Final de Problemas

### 🔴 CRÍTICOS (Bloquean testabilidad y escalabilidad)

1. **Violación Masiva de DIP - Instanciación Directa de AxiosApiClient**
   - **Ubicación:** 46+ archivos (use-cases, páginas, componentes)
   - **Impacto:** Imposible testear, acoplamiento fuerte
   - **Solución:** Implementar DI Container, inyectar IApiClient

2. **Acoplamiento Directo con localStorage en AxiosApiClient**
   - **Ubicación:** `adapters/api/AxiosApiClient.ts:68-83`
   - **Impacto:** Imposible cambiar store, violación de separación
   - **Solución:** Abstraer acceso a store, inyectar dependencia

3. **Falta de DI Container**
   - **Ubicación:** Todo el proyecto
   - **Impacto:** Imposible testear, acoplamiento fuerte
   - **Solución:** Implementar tsyringe o similar

### 🟠 IMPORTANTES (Afectan mantenibilidad)

4. **Interfaz IApiClient Demasiado Grande (Violación ISP)**
   - **Ubicación:** `ports/IApiClient.ts`
   - **Impacto:** Difícil mantener, violación ISP
   - **Solución:** Dividir en interfaces más pequeñas

5. **Manejo de Errores Duplicado e Inconsistente**
   - **Ubicación:** Todos los use-cases
   - **Impacto:** Código duplicado, difícil mantener
   - **Solución:** ErrorHandler centralizado o hook useErrorHandler

6. **Lógica de Negocio en Componentes**
   - **Ubicación:** `app/players/new/page.tsx`, otros
   - **Impacto:** Violación SRP, difícil reutilizar
   - **Solución:** Extraer a use-cases

7. **Múltiples Instancias de AxiosApiClient**
   - **Ubicación:** 46+ archivos
   - **Impacto:** Memory leak, inconsistencia de token
   - **Solución:** Singleton o DI Container

### 🟡 MEJORAS RECOMENDADAS (Mejoran calidad pero no críticas)

8. **Uso Excesivo de `any` (30+ ocurrencias)**
   - **Solución:** Usar tipos específicos o `unknown` con type guards

9. **Métodos Largos (usePlayers 210 líneas, AxiosApiClient 958 líneas)**
   - **Solución:** Dividir en funciones/hooks más pequeños

10. **Falta de Validación de Respuestas del API**
    - **Solución:** Validar con Zod schemas

11. **Falta de Tests Unitarios**
    - **Solución:** Agregar tests con Jest + React Testing Library

12. **Duplicación de Código (instanciación API client, manejo de token)**
    - **Solución:** Factory pattern o DI Container

13. **Falta de Abstracción para Store (Zustand)**
    - **Solución:** Crear interfaz IAuthStore, inyectar dependencia

14. **Nombres Poco Expresivos (`err: any`, `data: any`)**
    - **Solución:** Usar nombres más descriptivos y tipos específicos

---

## 🎯 9. Conclusión

### 9.1 Evaluación General de Calidad

**Puntuación Estimada: 5/10**

**Fortalezas:**
- ✅ Estructura de carpetas clara (domain, use-cases, adapters, ports)
- ✅ Uso de TypeScript con tipos (parcial)
- ✅ Validación con Zod en formularios
- ✅ Separación de use-cases (parcial)
- ✅ Uso de hooks personalizados

**Debilidades Críticas:**
- ❌ Violación masiva de DIP (46+ instanciaciones directas)
- ❌ Acoplamiento fuerte con implementaciones concretas
- ❌ Falta de DI Container
- ❌ Interfaz demasiado grande (violación ISP)
- ❌ Manejo de errores duplicado
- ❌ Lógica de negocio en componentes

### 9.2 Riesgos a Largo Plazo

**Si NO se corrigen los problemas críticos:**

1. **Técnico:**
   - Imposible testear adecuadamente (sin mocks complejos)
   - Imposible cambiar implementación de API client
   - Refactorizaciones costosas y riesgosas
   - Memory leaks por múltiples instancias

2. **Negocio:**
   - Tiempo de desarrollo lento
   - Bugs difíciles de detectar (sin tests)
   - Dificultad para agregar features
   - Deuda técnica creciente

3. **Mantenimiento:**
   - Cambios requieren modificar múltiples archivos
   - Bugs en un lugar afectan otros
   - Onboarding de nuevos desarrolladores difícil

### 9.3 Enfoque General de Refactorización (Sin Reescribir)

**Fase 1: Fundamentos (Críticos)**
1. Implementar DI Container (tsyringe)
2. Inyectar IApiClient en lugar de instanciar AxiosApiClient
3. Abstraer acceso a store (IAuthStore)
4. Eliminar acoplamiento con localStorage en AxiosApiClient

**Fase 2: Limpieza (Importantes)**
1. Dividir IApiClient en interfaces más pequeñas
2. Centralizar manejo de errores
3. Extraer lógica de negocio de componentes a use-cases
4. Crear singleton o factory para API client

**Fase 3: Mejoras (Recomendadas)**
1. Eliminar uso de `any` (usar tipos específicos)
2. Dividir métodos largos
3. Agregar validación de respuestas con Zod
4. Agregar tests unitarios
5. Mejorar nombres de variables

**Estrategia:**
- Refactorizar incrementalmente
- Mantener funcionalidad existente
- Una refactorización a la vez
- Validar con tests después de cada cambio

---

## 📝 Notas Finales

Este análisis se basa **estrictamente en el código existente**, sin asumir requisitos no documentados. Los problemas identificados son **reales y verificables** en el código fuente.

**Recomendación Principal:**
Comenzar con la **Fase 1 (Fundamentos)** antes de agregar nuevas features. Los problemas críticos de arquitectura deben resolverse primero para evitar que la deuda técnica crezca exponencialmente.

---

**Fin del Análisis**
