# Evitar el reinicio de la subida al seleccionar un archivo

**Approval status:** Pending team review
**Request authorization:** chat 2026-11-17, corregir reinicio de subida
**Approved on:** pending
**Approved by:** pending
**Used for:** diagnóstico, corrección del formulario y pruebas de regresión
**Provider:** Codex

## Prompt

Falla al subir videos. Cuando selecciono el video que quiero como por ejemplo este
Descargas/Ostia tio que no lo he enchufado
Cuando lo selecciono a traves de protube se borra el texto y empieza de 0. Corrigelo

## Notes

main 2984ad5 incluye la PR de apariencia y posteriores cambios de perfil/analíticas/etiquetas. Conservarlos. El retorno de foco revalida sesión y desmonta el formulario de subida; reutilizar el patrón de identidad confirmada de ProfilePage sin modificar la política global de sesión. Usar medios de prueba existentes, no el archivo privado del usuario. Registro y resultados en specs/sprint-3/tasks.md UP-F1..UP-F3. No se autoriza publicación remota por este registro.
