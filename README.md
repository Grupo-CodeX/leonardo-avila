# Servidor Web Linux: Nginx, Hosts Virtuales y Backend con Sesiones

Actividad de Sistemas Operativos II — Universidad Privada Domingo Savio
Autor: Leonardo Avila Bejarano · Grupo CodeX

## Arquitectura

```
Cliente (Windows: navegador / curl) --HTTP:80--> Ubuntu Server 26.04 (192.168.56.10)
                                                  └─ Nginx 1.28 (puerto 80)
                                                      ├─ sitio1.local → /var/www/sitio1 (estático)
                                                      └─ app.local    → proxy_pass 127.0.0.1:3000
                                                                          └─ Node.js 22 + Express (sesiones)
```

- Red VirtualBox: NAT (internet) + Solo-anfitrión con IP fija `192.168.56.10/24`.
- El backend escucha solo en `127.0.0.1:3000`: únicamente es accesible a través de Nginx.
- Firewall UFW: entrada denegada por defecto; abiertos 22 (SSH), 80 y 443.
- Hardening: `server_tokens off` en Nginx y `X-Powered-By` deshabilitado en Express.

## Estructura del repositorio

| Ruta | Destino en el servidor | Descripción |
|---|---|---|
| `netplan/00-installer-config.yaml` | `/etc/netplan/` | IP estática en `enp0s8` |
| `netplan/99-disable-network-config.cfg` | `/etc/cloud/cloud.cfg.d/` | Evita que cloud-init sobrescriba la red |
| `nginx/nginx.conf` | `/etc/nginx/` | Configuración global (`server_tokens off`) |
| `nginx/sites-available/sitio1.conf` | `/etc/nginx/sites-available/` | Host virtual estático |
| `nginx/sites-available/app.conf` | `/etc/nginx/sites-available/` | Host virtual con proxy inverso |
| `www/sitio1/` | `/var/www/sitio1/` | Página principal y errores 404 / 50x |
| `www/app-errores/` | `/var/www/app-errores/` | Errores 404 / 502 del proxy |
| `systemd/app-sesiones.service` | `/etc/systemd/system/` | Servicio del backend (usuario `deploy`) |
| `app/` | `/home/deploy/app/` | Backend Node.js + Express + express-session |
| `docs/` | — | Diagrama, capturas y bitácora de IA |

## Despliegue

```bash
sudo apt install -y nginx nodejs npm ufw
sudo cp nginx/sites-available/*.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/sitio1.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo cp -r www/* /var/www/
sudo nginx -t && sudo systemctl reload nginx

sudo adduser deploy
sudo cp -r app /home/deploy/ && sudo chown -R deploy:deploy /home/deploy/app
sudo -u deploy bash -c "cd /home/deploy/app && npm install"
sudo cp systemd/app-sesiones.service /etc/systemd/system/   # editar SESSION_SECRET
sudo systemctl daemon-reload && sudo systemctl enable --now app-sesiones
```

En el cliente Windows, agregar a `C:\Windows\System32\drivers\etc\hosts`:

```
192.168.56.10   sitio1.local
192.168.56.10   app.local
```

## Pruebas

```bash
curl -v http://sitio1.local/                                          # 200 OK
curl -v http://sitio1.local/no-existe                                 # 404 personalizado
curl -v -H "Host: app.local" http://192.168.56.10/                    # vhost por cabecera Host
curl -v -c cookies.txt -d "usuario=leonardo" http://app.local/login   # Set-Cookie: sid
curl -v -b cookies.txt http://app.local/api/info                      # sesión persistente
```

## Rutas del backend

| Método | Ruta | Función |
|---|---|---|
| GET | `/` | Formulario o saludo con contador de visitas |
| POST | `/login` | Crea la sesión y redirige (302) |
| GET | `/logout` | Destruye la sesión y borra la cookie |
| GET | `/api/info` | JSON con sesión, IP del cliente y cabeceras del proxy |

## Limitaciones

- Las sesiones se guardan en memoria (MemoryStore): se pierden al reiniciar el servicio. En producción se usaría Redis.
- Sin HTTPS: en producción se agregaría un certificado TLS (por ejemplo, Let's Encrypt).
