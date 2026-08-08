# Plan de mejoras UI/UX — Ours

Evaluación del frontend actual. **Sin features nuevas**: todo lo de aquí es mejorar
lo que ya existe. Donde algo requeriría una feature o una migración, está marcado
como fuera de alcance y separado al final.

## Método

Medí lo que se puede medir sin navegador:

- **Alturas** derivadas de las clases Tailwind actuales (aproximadas, no medidas en
  un dispositivo real).
- **Contraste WCAG** calculado sobre los valores reales de `src/index.css`.
- **Objetivos táctiles** leídos de las clases.
- **Uso real**, según lo que reportaste: casi todo cae en *Dates / Food*, el resto
  ocasional; hay planes de comida que viven en *Low Budget*; el uso dominante son
  cenas de noche.

No verificado: nada visual ni de gestos. Requiere el dispositivo.

---

## Hallazgo principal: la app es 70% chrome

En el tab *To do*, antes del primer plan hay **485px de interfaz**:

| Altura | Elemento |
|-------:|----------|
| 131px | Header (título + contadores + avatares + tabs) |
| 95px | FilterBar (búsqueda + 3 selects + corazón) |
| 142px | Coming up (carrusel) |
| 57px | Quick add |
| 60px | Padding + cabecera de categoría |
| **485px** | **total** |

Con eso:

- **iPhone 15**: quedan 218px → **3.4 planes visibles**
- **iPhone SE**: quedan 72px → **1.1 planes visibles**

La app existe para mirar una lista, y la lista es lo que menos espacio tiene. Esto
lo causé yo: en los tres tiers fui apilando cosas arriba (búsqueda, orden, Coming
up, quick add) sin mirar el total acumulado. Cada una se justificaba sola; juntas
no.

**Este es el problema que más vale la pena resolver, y el resto del documento es
secundario frente a él.**

---

## 1. Recuperar espacio vertical

### 1.1 Colapsar el FilterBar detrás de un botón — 95px
La mayoría de sesiones no filtran. Seis controles permanentes para una acción
ocasional. Un botón de filtro en el header (con punto cuando hay filtros activos)
que despliega el panel. La búsqueda puede quedar como icono que expande.
→ [FilterBar.tsx](src/components/plans/FilterBar.tsx), [HomePage.tsx](src/pages/HomePage.tsx)

### 1.2 Header que se encoge al hacer scroll — ~60px
El nombre de la pareja y los avatares son decorativos: los ves una vez y ya. Al
bajar, colapsar a una barra fina con solo los tabs.
→ [HomePage.tsx:182](src/pages/HomePage.tsx#L182)

### 1.3 Coming up más compacto — ~60px
Las tarjetas de 100px de alto son mucho para "el jueves, cena en X". Una fila de
chips de una línea da la misma información en 40px.
→ [UpcomingSection.tsx](src/components/plans/UpcomingSection.tsx)

### 1.4 Eliminar el FAB
Hay dos formas de crear un plan compitiendo en la misma pantalla: el input de
quick add (permanente, arriba) y el FAB (flotante, tapando la lista). El quick add
lo dejó redundante. Quitarlo libera la esquina y elimina una decisión.
→ [HomePage.tsx:293](src/pages/HomePage.tsx#L293)

**Recuperado: ~215px.** De 3.4 a ~6.7 planes visibles en iPhone 15; de 1.1 a ~4.4
en SE.

---

## 2. La estructura no coincide con cómo usan la app

Esto es lo segundo más valioso, y es puramente de frontend.

### 2.1 Dejar de agrupar por categoría
Agrupar tiene sentido cuando los grupos están equilibrados. Con casi todo en
*Dates / Food*, lo que se produce es un acordeón gigante y tres casi vacíos: 48px
de cabecera por grupo que no ayudan a encontrar nada, y un acordeón colapsable
para una lista que nunca se colapsa.

Una lista plana con el orden que ya existe (Newest / Wanted / Cheapest / Rating)
es más útil y ahorra ~50px por grupo. La categoría pasa a ser un dato de la fila,
no una división estructural.
→ [PlanList.tsx](src/components/plans/PlanList.tsx), [CategorySection.tsx](src/components/plans/CategorySection.tsx)

### 2.2 El presupuesto ya resuelve "Low Budget" — hay que hacerlo visible
Que existan planes de comida dentro de *Low Budget* es síntoma de que el modelo
de categoría única los obliga a elegir un eje. Pero el dato de presupuesto **ya
existe** (`budget_estimate`), y el orden "Cheapest" que se agregó en Tier 1 ya lo
explota. El problema es que el campo está escondido tras "Add more details", así
que casi nunca se llena, y entonces codifican "barato" como categoría.

Sacar el presupuesto al bloque visible del formulario. Con eso, una cena barata es
*Dates / Food* + 60.000 y aparece con "Cheapest" — sin perder que es comida.
→ [PlanForm.tsx](src/components/plans/PlanForm.tsx)

### 2.3 Quitar el selector de orden en el tab Done
Es un control muerto: `MemoriesList` agrupa por mes e **ignora `filters.sort`**.
El desplegable se ve, se puede cambiar, y no hace nada. Igual "proposed by" aporta
poco ahí. En Done deberían quedar solo búsqueda y categoría.
→ [MemoriesList.tsx:53](src/components/plans/MemoriesList.tsx#L53)

---

## 3. La fila de plan está sobrecargada

`PlanItem` acumula cinco elementos en 65px de alto y ~375px de ancho: checkbox,
título + metadatos, avatar del proponente, miniatura y corazón. El mobiliario se
come ~168px, dejando ~207px para el nombre — que es lo único que de verdad
importa.

Peor: **tres zonas tocables adyacentes** (checkbox, cuerpo, corazón) con objetivos
por debajo del mínimo de 44px de iOS. Errar el tap es fácil, y dos de los tres
errores posibles son destructivos en percepción (marcar hecho, quitar corazón).

Propuesta: el avatar del proponente pasa a ser un borde de color de 2px a la
izquierda de la fila (misma información, cero ancho), y el corazón solo aparece
cuando el plan tiene alguno o en el detalle. El checkbox sube a 44px.
→ [PlanItem.tsx](src/components/plans/PlanItem.tsx)

### Auditoría de objetivos táctiles

| Elemento | Actual | Mínimo |
|---|---:|---:|
| Quitar foto ([ImageUpload.tsx:71](src/components/ui/ImageUpload.tsx#L71)) | **20px** | 44px |
| Corazón ([HeartButton.tsx](src/components/ui/HeartButton.tsx)) | 32px | 44px |
| Cerrar sheet ([Sheet.tsx:133](src/components/ui/Sheet.tsx#L133)) | 32px | 44px |
| Flechas de galería ([PlanDetail.tsx](src/components/plans/PlanDetail.tsx)) | 32px | 44px |
| Editar / borrar en detalle | 32px | 44px |
| Checkbox de completar | 40px | 44px |

El de 20px es el más grave: quitar una foto por error no tiene undo.

---

## 4. Contraste y tamaño de texto

Ratios calculados sobre `src/index.css`:

| Uso | Par | Claro | Oscuro |
|---|---|---:|---:|
| Descripción en la fila | `warm-300` / `white` | **2.12** | **2.81** |
| Metadatos de la fila | `warm-400` / `white` | **3.25** | 5.11 |
| Contador de categoría | `warm-400` / `cream-100` | **2.92** | 4.59 |

El mínimo para texto pequeño es 4.5. **La paleta clara falla en todos los
metadatos**; la oscura solo en la descripción. Súmale que ese texto está a
`text-[10px]` y `text-[11px]`, por debajo del piso legible en móvil.

Dos arreglos, ambos de bajo riesgo:
- Subir el texto secundario de 10/11px a 12px.
- Oscurecer `warm-400` y `warm-300` **solo en el tema claro** hasta pasar 4.5.

(Aparte, siguen los 4 pares de la paleta clara que reporté en Tier 3: los links
`sand-500` y el botón primario están en 3.37, los chips `blush-500` en 3.66. Esos
tocan la identidad visual, por eso no los cambié.)

---

## 5. Continuidad y estado

### 5.1 Se pierden filtros y posición de scroll al navegar
`filters` es estado local de `HomePage` ([HomePage.tsx:50](src/pages/HomePage.tsx#L50)),
y las rutas desmontan el componente. Vas a Surprise, vuelves, y perdiste el filtro
y el punto de la lista donde estabas. Con listas largas es de lo más molesto que
hay. Un store pequeño de zustand, o subir el estado por encima del `<Routes>`.

### 5.2 Los planes desaparecen sin transición
Al marcar hecho, la fila se esfuma de golpe: la lista salta y pierdes la
referencia visual. El toast de undo ayuda pero no compensa el salto. Una salida de
150ms (fade + colapso de altura) da continuidad. Igual para reordenar al cambiar
el orden.

### 5.3 Cabeceras de página inconsistentes
Home, Surprise y Profile construyen su header por separado con estructuras
distintas. Un `<PageHeader>` compartido corrige el desalineo y quita duplicación.

---

## Plan sugerido

**Fase 1 — espacio (mayor impacto)**
1. Colapsar FilterBar tras un botón (§1.1)
2. Quitar el FAB (§1.4)
3. Quitar el quick add superior, ya que ya existe un boton flotante para eso
4. Lista plana, sin agrupar por categoría (§2.1)
5. Compactar Coming up (§1.3)

**Fase 2 — legibilidad y precisión**
5. Contraste + tamaño de texto (§4)
6. Objetivos táctiles a 44px, empezando por el de 20px (§3)
7. Aligerar la fila de plan (§3)

**Fase 3 — pulido**
8. Persistir filtros y scroll (§5.1)
9. Transiciones de salida y reordenamiento (§5.2)
10. Header que se encoge (§1.2)
11. Sacar el presupuesto de "more details" (§2.2)
12. Limpiar controles muertos en Done (§2.3)
13. `<PageHeader>` compartido (§5.3)

---

## Fuera de alcance (serían features, tú decides)

No los incluí porque pediste UX, no features. Los dejo dimensionados:

- **Categorías múltiples / etiquetas.** Es la solución de raíz a que una cena
  barata no pueda ser comida *y* barata a la vez. Requiere migración (tabla de
  unión o `text[]`) y tocar formulario, filtros y lista. Lo de §2.2 mitiga el caso
  concreto sin nada de esto.
- **Momento del día (cena / almuerzo / desayuno).** Como usan la app sobre todo
  para cenas, hoy no distingue nada — pero si casi todo son cenas, el campo tampoco
  aporta mucho hasta que dejen de serlo. Sería una columna y un selector.
- **Subtipos de comida** (italiana, asiática…). Mismo problema de eje único que
  §2.2. Yo esperaría a tener bastantes más planes antes de meter taxonomía.
