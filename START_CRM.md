# 🚀 CRM Quick Start Guide

## Vor dem ersten Start (Einmal ausführen)

### 1. Datenbank einrichten
```bash
# PostgreSQL Shell öffnen
psql -U postgres

# In PostgreSQL Shell:
CREATE DATABASE rico_tattoo_db;
\c rico_tattoo_db
\i "D:/Anonymous/Rico Tattoo Artist/Project/backend/schemas/database.sql"
\q
```

### 2. Admin-Benutzer erstellen
```bash
cd "D:\Anonymous\Rico Tattoo Artist\Project\backend"
npm run create-admin
```

**Zugangsdaten notieren!** z.B.:
- Benutzername: `rico`
- Passwort: `[Ihr sicheres Passwort]`

---

## Täglicher Start

### Schritt 1: Backend starten
```bash
cd "D:\Anonymous\Rico Tattoo Artist\Project\backend"
npm run dev
```

✅ Backend läuft auf: http://localhost:3000

### Schritt 2: Frontend starten (Neues Terminal)
```bash
cd "D:\Anonymous\Rico Tattoo Artist\Project\frontend"
ng serve
```

✅ Frontend läuft auf: http://localhost:4200

---

## CRM Dashboard aufrufen

1. Browser öffnen
2. Gehe zu: **http://localhost:4200/admin/login**
3. Anmelden mit Admin-Zugangsdaten
4. Leads verwalten! 🎉

---

## URLs Übersicht

| Was | URL |
|-----|-----|
| **Öffentliches Lead-Formular** | http://localhost:4200/ |
| **Admin Login** | http://localhost:4200/admin/login |
| **Admin Dashboard** | http://localhost:4200/admin/dashboard |
| **Backend API** | http://localhost:3000/api |

---

## Häufige Probleme

### Backend startet nicht
- ✅ Ist PostgreSQL gestartet?
- ✅ Existiert die `.env` Datei im backend Ordner?
- ✅ Sind die Datenbankzugangsdaten in `.env` korrekt?

### Frontend startet nicht
- ✅ Wurde `npm install` im frontend Ordner ausgeführt?
- ✅ Ist Angular CLI installiert? (`npm install -g @angular/cli`)

### Login funktioniert nicht
- ✅ Läuft das Backend?
- ✅ Wurde ein Admin-Benutzer erstellt? (`npm run create-admin`)
- ✅ Sind die Zugangsdaten korrekt?

---

## Stoppen

- Backend: `Ctrl + C` im Backend-Terminal
- Frontend: `Ctrl + C` im Frontend-Terminal
