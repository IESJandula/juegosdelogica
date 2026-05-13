# juegosdelogica

Juegos de lógica pensados para usar en la feria de la ciencia y como material educativo para que el alumnado practique pensamiento computacional y resolución de problemas.

**Estado:** En desarrollo

**Tecnologías:** Vue 3, Vite y TypeScript

## Requisitos

- Node: >= 20.19.0 o >= 22.12.0 (ver `engines` en el `package.json` del proyecto)
- npm o yarn

## Instalación

1. Clona el repositorio:

	git clone https://github.com/tu-usuario/juegosdelogica.git

2. Entra en la carpeta de la aplicación y instala dependencias:

	cd juegosLogicaCod
	npm install

## Desarrollo

Inicia el servidor de desarrollo (Vite):

```bash
npm run dev
```

Abre la URL que indique Vite (por defecto http://localhost:5173).

## Build / Producción

Generar una versión optimizada:

```bash
npm run build
```

Probar la build localmente:

```bash
npm run preview
```

## Estructura del proyecto (relevante)

- `juegosLogicaCod/src/` : código fuente de la aplicación.
- `juegosLogicaCod/src/components/` : componentes Vue que implementan los puzzles, por ejemplo `Aparcar.vue`, `LobosPuzzle.vue`, `PuzzleSelector.vue`, `RojoAzulPuzzle.vue`, `Ships.vue` y `TortitasPuzzle.vue`.
- `juegosLogicaCod/public/` : recursos públicos y estáticos.

## Cómo contribuir

- Abre un issue describiendo la propuesta o el bug.
- Crea una rama con un nombre claro (`feature/descripcion` o `fix/descripcion`).
- Formatea el código antes de enviar el PR:

```bash
npm run format
```

- Ejecuta comprobación de tipos (TypeScript):

```bash
npm run type-check
```

- Envía un Pull Request; revisaremos y comentaremos los cambios.

