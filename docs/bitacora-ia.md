# Bitácora de uso de Inteligencia Artificial

**Actividad:** Servidor web Linux con Nginx, dos hosts virtuales y backend detrás de proxy inverso
**Materia:** Sistemas Operativos II · Universidad Privada Domingo Savio
**Autor:** Leonardo Avila Bejarano · Grupo CodeX
**Herramienta de IA:** Claude (Anthropic), modelo Claude Opus, en la aplicación Claude
**Herramientas complementarias:** Gamma (generación de la presentación)
**Periodo:** 3 al 5 de octubre de 2026

---

## 1. Criterio de uso

La IA se usó como **asistente técnico guiado paso a paso**. No ejecutó comandos en el servidor; todos los comandos los escribió y ejecutó el autor en la VM. Ninguna salida de la IA se dio por válida sin comprobarla en el servidor con:

- `sudo nginx -t` antes de recargar Nginx.
- `sudo netplan generate` antes de aplicar la red.
- `systemctl status`, `journalctl` y `ss -tlnp` para los servicios.
- `curl.exe -v` y DevTools desde el cliente Windows.
- `grep`, `cat` y `head` para confirmar que cada archivo quedó como se esperaba.

Después de cada paso se enviaba a la IA una captura del resultado real para que lo revisara antes de continuar.

---

## 2. Registro de interacciones

| # | Fecha | Fase | Consulta (resumen del prompt) | Qué devolvió la IA | Verificación / decisión del autor | Evidencia |
|---|---|---|---|---|---|---|
| 1 | 03/10 | Planificación | "Cómo podemos afrontar esta actividad" (enunciado completo) | Plan en 5 fases, decisión de backend (Node.js por encajar con `proxy_pass`), red NAT + solo-anfitrión, estructura del repositorio | Se adoptó el plan y el orden de trabajo | Esta bitácora |
| 2 | 03/10 | Presentación | Generar la presentación con el conector de Gamma | Primer intento rechazado por Gamma (plan gratuito: máximo 10 tarjetas). La IA reagrupó el contenido en 10 diapositivas y la regeneró con exportación .pptx | Se revisó en el editor de Gamma; las capturas reales se insertan manualmente | Presentación en Gamma |
| 3 | 05/10 | Conceptos | ¿Qué es un host virtual? ¿Puede ser Windows o Linux? ¿Qué es Nginx? | Aclaró que un host virtual de Nginx es un bloque `server` (archivo `.conf`), no una máquina virtual; explicó Nginx como servidor web y proxy inverso | Se corrigió un error de concepto propio antes de empezar | — |
| 4 | 05/10 | Instalación | Revisión de la configuración de la VM en VirtualBox (capturas) | Detectó que faltaba el Adaptador 2 (solo-anfitrión); recomendó 2 CPU | Se agregó el adaptador antes de instalar | Capturas de VirtualBox |
| 5 | 05/10 | Instalación | Revisión pantalla por pantalla del instalador de Ubuntu Server 26.04 | Indicó qué dejar por defecto (LVM, sin LUKS, sin proxy) y que **faltaba marcar "Install OpenSSH server"** | Se marcó OpenSSH; sin esto no habría acceso remoto | Capturas del instalador |
| 6 | 05/10 | Instalación | Aviso `watchdog: BUG: soft lockup` durante la instalación | Explicó que se debe a lentitud de la VM (posible Hyper-V activo), no a un error de instalación | Se esperó a que terminara; la instalación concluyó bien | Captura "Installation complete" |
| 7 | 05/10 | Red | Fijar IP estática con netplan | Comandos para desactivar la red de cloud-init y archivo YAML con `192.168.56.10/24` | **Error de la IA:** asumió el archivo `50-cloud-init.yaml`; el `ls /etc/netplan/` mostró `00-installer-config.yaml`. Se usó el nombre real | Capturas antes/después de `ip a` |
| 8 | 05/10 | Red | `cat` del archivo de netplan → `Permission denied` | Explicó los permisos `600` (solo root) de netplan | Se usó `sudo cat`; se documentaron los permisos | Captura `ls -l /etc/netplan` |
| 9 | 05/10 | Usuarios y servicios | Crear usuario de servicio, instalar paquetes, firewall, systemctl | Comandos `adduser`, `usermod -aG sudo`, `apt install`, reglas UFW (OpenSSH antes de `enable`) | Verificado con `id`, `ufw status verbose`, `systemctl status`. La IA explicó por qué `ssh.service` figura como `disabled` (activación por `ssh.socket`) | Capturas de `id`, UFW, systemctl |
| 10 | 05/10 | Servicios | Hora del servidor en UTC | Recomendó `timedatectl set-timezone America/La_Paz` | Aplicado; los logs pasaron a hora de Bolivia | Captura `timedatectl` |
| 11 | 05/10 | Nginx | Crear dos hosts virtuales y páginas de error propias | Archivos `sitio1.conf`, `app.conf` y 5 páginas HTML creadas con `tee` | Validado con `nginx -t`; probado 200, 404 y 502 en el navegador | Capturas del navegador y `nginx -t` |
| 12 | 05/10 | Nginx | Duda: "¿para pegar estos bloques debo estar en la carpeta?" | Explicó que `tee` crea el archivo en la ruta indicada, sin `cd` ni `nano` | — | — |
| 13 | 05/10 | Logs | Lectura e interpretación de logs | Comandos `tail`, `grep`, `tail -f` y explicación campo por campo del formato de access.log | Se identificaron 200, 404, 502 y **304 Not Modified**; el error.log mostró `Connection refused` hacia `127.0.0.1:3000` | Capturas de logs |
| 14 | 05/10 | Backend | Aplicación Node.js con sesiones y cookies | `server.js` con Express + express-session (cookie `sid` HttpOnly, SameSite=Lax, 30 min), `trust proxy` y `/api/info` | Probado en navegador: login, contador de visitas, IP real del cliente vía `X-Forwarded-For` | Capturas de app.local |
| 15 | 05/10 | Backend | Convertir el backend en servicio | Unidad systemd `app-sesiones.service` con usuario `deploy` y secreto generado con `openssl rand` | Verificado con `systemctl status`, `journalctl` y `ss -tlnp` (Node solo en `127.0.0.1:3000`). Se documentó el aviso de MemoryStore como limitación | Capturas de status y `ss` |
| 16 | 05/10 | Análisis HTTP | Pruebas con `curl -v` y DevTools | 7 pruebas: 200, 404, selección de vhost por cabecera `Host`, `Set-Cookie`, reenvío de cookie, petición sin cookie y acceso directo a `:3000` | Todas dieron el resultado esperado; el acceso a `:3000` terminó en timeout (UFW + bind local) | Capturas de PowerShell |
| 17 | 05/10 | Hardening | Ocultar versión del servidor y tecnología | `server_tokens off` y `app.disable('x-powered-by')` | **Error de la IA:** el `sed` buscaba `# server_tokens off;`, pero Ubuntu 26.04 trae `server_tokens build;`. Además faltaba el `cd app`. Se detectó porque `curl -I` seguía mostrando la versión; se corrigió y se verificó | Capturas `curl -I` antes/después |
| 18 | 05/10 | Repositorio | Reunir configuraciones y subirlas a GitHub (organización Grupo-CodeX) | Estructura de carpetas, `.gitignore`, README, sustitución del secreto por `CAMBIAR_ESTE_VALOR` | Revisado con `find`, `grep SESSION` y `git status` (sin `node_modules`) | Capturas de `git status` y `push` |
| 19 | 05/10 | Repositorio | Error `cp: Not a directory` | Indicó que faltaba `cd ~/servidor-web-linux` | Corregido; los 15 archivos quedaron en su lugar | Captura `find . -type f` |
| 20 | 05/10 | Repositorio | README no se creó | **Error de la IA:** el README tenía bloques ``` anidados que rompían el formato al copiar. Se reenvió con `~~~`; al pegar se perdió una tilde (`~~`). Se corrigió con `sed` | Verificado con `grep -n` y `wc -l` | Capturas del README |
| 21 | 05/10 | Repositorio | `ssh -T git@github.com` → `Permission denied (publickey)` | Primero se ejecutó en Windows en vez del servidor; luego se comprobó con `github.com/LeonardoAvilaB.keys` que la llave no estaba registrada; GitHub rechazó la llave pegada a mano. La IA propuso copiarla con `scp` + `Set-Clipboard` | Llave registrada; autenticación correcta y `push` exitoso a `Grupo-CodeX/leonardo-avila` | Capturas de `ssh -T` y `git push` |
| 22 | 05/10 | Documentación | Diagrama de arquitectura y esta bitácora | Diagrama SVG/PNG con cliente, red, UFW, Nginx, vhosts, backend, sesiones y flujo numerado; borrador de esta bitácora | El autor revisó que cada dato coincide con su servidor (IPs, versiones, nombres) | `docs/diagrama-arquitectura.png` |

---

## 3. Errores de la IA detectados y corregidos

| Error | Cómo se detectó | Corrección |
|---|---|---|
| Nombre de archivo de netplan supuesto (`50-cloud-init.yaml`) | `ls /etc/netplan/` mostró `00-installer-config.yaml` | Se editó el archivo real |
| Patrón de `sed` para `server_tokens` basado en versiones anteriores de Ubuntu | `curl -I` seguía mostrando `nginx/1.28.3 (Ubuntu)`; `grep` mostró `server_tokens build;` | Nuevo `sed` sobre `server_tokens build;` |
| Comando `sed` sobre `server.js` sin cambiar de carpeta | `X-Powered-By: Express` seguía apareciendo | Se usó la ruta absoluta `/home/deploy/app/server.js` |
| README con bloques de código anidados | `head: cannot open 'README.md'` | Bloques internos con `~~~` y luego normalizados con `sed` |
| Supuso que la llave SSH se pegaría correctamente desde la terminal | GitHub: "La clave no es válida" | Copia exacta con `scp` y `Set-Clipboard` |

**Lección:** las instrucciones de la IA dependen de supuestos sobre versiones y nombres de archivo. Cada comando que modificaba un archivo se verificó leyendo el resultado (`grep`, `cat`, `curl -I`) antes de continuar.

---

## 4. Lo que hizo el autor sin IA

- Instalación de VirtualBox y creación de la VM.
- Ejecución de todos los comandos en el servidor y en Windows.
- Edición del archivo `hosts` de Windows como administrador.
- Creación del repositorio en la organización Grupo-CodeX y registro de la llave SSH en GitHub.
- Toma de capturas, revisión de resultados y decisiones de configuración (nombres de usuario y servidor, nombre del repositorio).

---

## 5. Reflexión

La IA aceleró la configuración y explicó el porqué de cada paso (permisos, activación por socket, cookies firmadas, cabeceras del proxy). Sin embargo, cometió errores al asumir versiones y nombres de archivo, que solo se detectaron porque cada paso se comprobó en el servidor real. El valor del trabajo está en esa verificación: la IA propuso; el resultado se validó con `nginx -t`, `systemctl`, `journalctl`, los logs y `curl -v`.
