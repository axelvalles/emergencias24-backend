# Matriz de estados del bot

Esta guía resume cómo navega hoy el bot de WhatsApp y qué debe revisar el equipo cuando agregue o modifique un flujo.

## Camino rápido

1. Ubica el estado actual en `src/bot/state-machine/index.ts`.
2. Verifica qué prompt envía ese estado en `src/bot/state-machine/navigation.config.ts`.
3. Confirma el destino de cada respuesta válida, inválida y global (`menu`, `volver`, `cancelar`, `ayuda`).

## Comandos globales

| Comando                    | Efecto                                             | Estado resultante         |
| -------------------------- | -------------------------------------------------- | ------------------------- |
| `menu`, `inicio`           | Muestra el menú principal                          | `WAITING_MENU_OPTION`     |
| `volver`, `atras`, `atrás` | Repite el prompt del paso anterior                 | depende del estado actual |
| `cancelar`, `salir`        | Cancela el flujo en curso y reinicia la navegación | `WAITING_MENU_OPTION`     |
| `ayuda`, `help`            | Explica cómo navegar sin cambiar el prompt lógico  | mantiene el estado actual |

## Reglas de navegación

- Todo flujo terminal regresa al menú principal; no deja al usuario en `START` esperando el siguiente mensaje.
- Todo prompt operativo debe incluir la pista de navegación con `menu`, `volver` y `cancelar`.
- Toda respuesta inválida debe mantener al usuario en el mismo estado.
- Si la sesión vence por inactividad, el bot avisa y vuelve al menú principal.

## Matriz principal

| Estado                                    | Prompt principal          | Entrada válida                | Siguiente estado                                        | Si falla                             |
| ----------------------------------------- | ------------------------- | ----------------------------- | ------------------------------------------------------- | ------------------------------------ |
| `START`                                   | Menú principal (template) | cualquier reinicio controlado | `WAITING_MENU_OPTION`                                   | n/a                                  |
| `WAITING_MENU_OPTION`                     | Menú principal            | slug de opción del menú       | depende del servicio                                    | se mantiene en `WAITING_MENU_OPTION` |
| `IMMEDIATE_ATTENTION_WAITING_LOCATION`    | pedir ubicación           | texto o ubicación             | `START` -> menú                                         | repite estado                        |
| `TELEMEDICINE_WAITING_ID`                 | pedir cédula              | cédula válida                 | `START` -> menú                                         | repite estado                        |
| `HOME_CARE_WAITING_MUNICIPALITY`          | pedir municipio           | número válido                 | `HOME_CARE_WAITING_DOMICILE_CONFIRMATION`               | repite estado                        |
| `HOME_CARE_WAITING_DOMICILE_CONFIRMATION` | confirmar servicio        | `si` / `no`                   | `HOME_CARE_WAITING_LOCATION` o `START` -> menú          | repite estado                        |
| `HOME_CARE_WAITING_LOCATION`              | pedir ubicación           | texto o ubicación             | `START` -> menú                                         | repite estado                        |
| `MEDICAL_CONSULTATIONS_WAITING_SPECIALTY` | pedir especialidad        | `1..10`                       | `START` -> menú o `MEDICAL_CONSULTATIONS_WAITING_OTHER` | repite estado                        |
| `MEDICAL_CONSULTATIONS_WAITING_OTHER`     | pedir especialidad libre  | texto                         | `START` -> menú                                         | repite estado                        |
| `LABORATORY_WAITING_TEST`                 | pedir exámenes            | texto                         | `START` -> menú                                         | repite estado                        |
| `AMBULANCE_WAITING_MUNICIPALITY`          | pedir municipio           | número válido                 | `AMBULANCE_WAITING_CONFIRMATION`                        | repite estado                        |
| `AMBULANCE_WAITING_CONFIRMATION`          | confirmar servicio        | `si` / `no`                   | `AMBULANCE_WAITING_LOCATION` o `START` -> menú          | repite estado                        |
| `AMBULANCE_WAITING_LOCATION`              | pedir ubicación           | texto o ubicación             | `START` -> menú                                         | repite estado                        |
| `EQUIPMENT_RENTAL_WAITING_OPTION`         | pedir equipo              | `1..9`                        | `START` -> menú                                         | repite estado                        |
| `Plan_WAITING_OPTION`                     | pedir tipo de plan        | `1..3`                        | `START` -> menú                                         | repite estado                        |

## Historial para `volver`

El comando `volver` usa dos mecanismos:

| Fuente                                                                      | Uso                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| `previousState` guardado en sesión                                          | cuando existe una transición inmediata confiable |
| `PREVIOUS_STATE_BY_CURRENT` en `src/bot/state-machine/navigation.config.ts` | fallback para reconstruir el paso anterior       |

## Checklist para tocar un flujo

- [ ] El estado nuevo está declarado en `src/bot/state-machine/types.ts`.
- [ ] El handler está registrado en `src/bot/state-machine/index.ts`.
- [ ] El prompt se puede reproducir desde `src/bot/state-machine/navigation.config.ts`.
- [ ] Las respuestas inválidas dejan al usuario en el mismo estado.
- [ ] El final del flujo regresa al menú principal.
- [ ] Hay pruebas del camino feliz y al menos una respuesta inválida.

## Archivos clave

- `src/bot/bot.service.ts` — orquesta comandos globales, timeout y retorno automático al menú.
- `src/bot/session-store.service.ts` — persistencia Redis y `previousState`.
- `src/bot/state-machine/navigation.config.ts` — prompts, hints y fallback de `volver`.
- `src/bot/state-machine/global-commands.config.ts` — comandos globales.
- `src/bot/state-machine/index.ts` — mapa de estados a handlers.
