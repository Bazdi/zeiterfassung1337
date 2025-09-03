# Anleitung: Deployment auf VPS (PM2 + Nginx)

Diese Anleitung beschreibt den Produktiv‑Betrieb der App auf deinem VPS mit PM2 und Nginx.

Domain: https://mobiel-timecard.de/
App‑Pfad: /var/www/zeiterfassung1337
App‑Port: 3000 (lokal, nur über Nginx erreichbar)

## 1) Voraussetzungen prüfen

- Node.js 20 LTS installiert:
  ```bash
  node -v
  ```
- Firewall erlaubt Ports 80/443 (HTTP/HTTPS).
- Repo liegt unter `/var/www/zeiterfassung1337` und gehört deinem Deploy‑User.

## 2) .env konfigurieren

Im Verzeichnis `/var/www/zeiterfassung1337/.env` sicherstellen:

```bash
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=https://mobiel-timecard.de
NEXTAUTH_SECRET=<sicherer_wert>
# optional
PORT=3000
```

Tipp für Secret:
```bash
openssl rand -base64 32
```

## 3) App vorbereiten (Install, DB, Build)

```bash
cd /var/www/zeiterfassung1337
npm install
npm run db:setup   # Prisma push + generate + seed
npm run build
```

## 4) PM2 einrichten (Prozessmanager)

PM2 global installieren (falls nicht vorhanden) und App starten:

```bash
sudo npm i -g pm2
cd /var/www/zeiterfassung1337
pm2 start npm --name zeiterfassung1337 -- start
pm2 status
pm2 logs zeiterfassung1337 -f
```

Autostart aktivieren:

```bash
pm2 startup systemd
# führe den von PM2 ausgegebenen sudo-Befehl aus, z. B.:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u <dein-user> --hp /home/<dein-user>
pm2 save
```

Healthcheck lokal:
```bash
curl -I http://127.0.0.1:3000
```

## 5) Nginx als Reverse Proxy

Konfiguration unter `/etc/nginx/sites-available/zeiterfassung1337` anlegen/ersetzen:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name mobiel-timecard.de www.mobiel-timecard.de;

  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name mobiel-timecard.de www.mobiel-timecard.de;

  ssl_certificate /etc/letsencrypt/live/mobiel-timecard.de/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/mobiel-timecard.de/privkey.pem;

  # optionale Security Header
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

Aktivieren und neu laden:

```bash
sudo ln -s /etc/nginx/sites-available/zeiterfassung1337 /etc/nginx/sites-enabled/zeiterfassung1337
# optional: Standardseite deaktivieren
# sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 6) TLS mit Let’s Encrypt (falls noch nicht vorhanden)

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mobiel-timecard.de -d www.mobiel-timecard.de
```

Auto‑Renew läuft per Timer. Status prüfen:
```bash
systemctl status certbot.timer
```

## 7) Validierung

- PM2 Prozess läuft: `pm2 status`
- App lokal erreichbar: `curl -I http://127.0.0.1:3000`
- Domain liefert 200/3xx: `curl -I https://mobiel-timecard.de`
- Nginx Logs bei Bedarf prüfen:
  ```bash
  sudo journalctl -u nginx -e --no-pager
  sudo tail -n 200 /var/log/nginx/access.log
  sudo tail -n 200 /var/log/nginx/error.log
  ```

## 8) Updates deployen

```bash
cd /var/www/zeiterfassung1337
git pull
# falls Abhängigkeiten/Schema geändert wurden
npm install && npm run db:setup
npm run build
pm2 restart zeiterfassung1337 --update-env
```

## 9) Troubleshooting

- 502 Bad Gateway: Läuft die App auf Port 3000?
  ```bash
  ss -tulpn | grep :3000
  pm2 logs zeiterfassung1337 -f
  ```
- .env geändert? Danach in der Regel `npm run build` und `pm2 restart zeiterfassung1337 --update-env`.
- Prisma/SQLite: Standard‑DB liegt relativ zum Projekt (`prisma/dev.db`).
- Rechte/Ownership: App‑Ordner sollte dem Deploy‑User gehören, Nginx braucht nur Proxy‑Zugriff.

## 10) Optional: Betrieb ohne PM2 (systemd)

Alternativ kannst du systemd verwenden. Service unter `/etc/systemd/system/zeiterfassung1337.service`:

```ini
[Unit]
Description=ZTimeTracker (Next.js)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/var/www/zeiterfassung1337
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXTAUTH_URL=https://mobiel-timecard.de
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Dann aktivieren:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zeiterfassung1337
sudo journalctl -u zeiterfassung1337 -f
```

---

Hinweis: Passe Domain/Benutzer ggf. an deine Umgebung an. Bei Fragen oder Fehlern kannst du die relevanten Log‑Ausgaben posten.

