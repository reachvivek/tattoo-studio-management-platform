# Rico Tattoo Artist - CRM Setup & Usage Guide

## Projektübersicht

Ein vollständiges Lead-Management-System (CRM) für Rico Tattoo Artist mit:

- ✅ **Lead-Erfassung** - Öffentliches Formular für Kundenanfragen
- ✅ **Admin-Dashboard** - Sichere Verwaltungsoberfläche für Leads
- ✅ **Authentifizierung** - JWT-basiertes Login-System
- ✅ **Lead-Verwaltung** - Vollständige CRUD-Operationen
- ✅ **Status-Tracking** - Lead-Status-Management (Neu, Kontaktiert, Qualifiziert, Konvertiert, Abgelehnt)
- ✅ **Suche & Filter** - Durchsuchbare Lead-Datenbank
- ✅ **Responsive Design** - Funktioniert auf allen Geräten

---

## 🚀 Ersteinrichtung

### 1. Datenbank einrichten

Zuerst die PostgreSQL-Datenbank und Tabellen erstellen:

```bash
# PostgreSQL Shell öffnen
psql -U postgres

# Datenbank erstellen
CREATE DATABASE rico_tattoo_db;

# Mit Datenbank verbinden
\c rico_tattoo_db

# Schema importieren
\i Project/backend/schemas/database.sql
```

### 2. Backend konfigurieren

```bash
cd Project/backend

# .env Datei erstellen (falls noch nicht vorhanden)
cp .env.example .env

# .env bearbeiten und folgende Werte eintragen:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rico_tattoo_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### 3. Admin-Benutzer erstellen

Erstellen Sie einen Admin-Benutzer für den Zugriff auf das CRM:

```bash
cd Project/backend
npm run create-admin
```

Folgen Sie den Anweisungen und geben Sie ein:

- Benutzername (z.B. `rico` oder `admin`)
- E-Mail
- Passwort

**Wichtig:** Notieren Sie sich diese Zugangsdaten!

### 4. Services starten

**Terminal 1 - Backend:**

```bash
cd Project/backend
npm run dev
```

Backend läuft auf: `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd Project/frontend
ng serve
```

Frontend läuft auf: `http://localhost:4200`

---

## 📋 Verwendung

### Für Kunden (Öffentlich)

Kunden können Leads einreichen unter:

```
http://localhost:4200/
```

### Für Admin (CRM)

#### Login

1. Gehen Sie zu: `http://localhost:4200/admin/login`
2. Melden Sie sich mit den erstellten Zugangsdaten an

#### Dashboard

Nach dem Login sehen Sie: bei einem Lead 2. Sie sehen:

- Vollständige Kontaktinformationen
- Tattoo-Beschreibung
- Referenzbilder
- Rabatt-Informationen
- Kampagnen-Daten (UTM-Parameter)
- Status-Verwaltung

#### Lead-Status ände

- **Statistiken** - Gesamtzahl der Leads, neue Leads, qualifizierte Leads, konvertierte Leads
- **Suche** - Suchen Sie nach Name, E-Mail oder Telefonnummer
- **Filter** - Filtern Sie nach Lead-Status
- **Lead-Liste** - Alle Leads in einer übersichtlichen Tabelle

#### Lead-Details ansehen

1. Klicken Sie auf "Details"rn
1. Öffnen Sie Lead-Details
1. Wählen Sie neuen Status aus Dropdown:
   - **Neu** - Frisch eingereicht
   - **Kontaktiert** - Erstkontakt hergestellt
   - **Qualifiziert** - Ernsthaftes Interesse bestätigt
   - **Konvertiert** - Termin vereinbart/Kunde gewonnen
   - **Abgelehnt** - Nicht interessiert/unpassend
1. Klicken Sie "Status aktualisieren"

#### Schnellkontakt

Direkt aus den Lead-Details:

- **E-Mail senden** - Öffnet Standard-E-Mail-Client
- **WhatsApp öffnen** - Öffnet WhatsApp-Chat

---

## 🔒 API-Endpunkte

### Öffentlich

- `POST /api/leads` - Neuen Lead erstellen

### Geschützt (benötigt Authentication)

- `POST /api/auth/login` - Admin-Login
- `GET /api/leads` - Alle Leads abrufen
- `GET /api/leads/:id` - Lead-Details abrufen
- `PATCH /api/leads/:id/status` - Lead-Status aktualisieren
- `GET /api/analytics/stats` - Statistiken abrufen

---

## 💼 Wert für Rico

### Bisherige Lösung

- **Kosten:** 150€/Monat = 1.800€/Jahr
- **Anpassungen:** Eingeschränkt
- **Daten:** Bei Drittanbieter

### Neue Lösung

- **Kosten:** 150€ einmalig
- **Anpassungen:** Vollständig anpassbar
- **Daten:** Vollständige Kontrolle
- **ROI:** Break-even nach 1 Monat!

### Zusätzliche Features (optional, gegen Aufpreis):

- 📧 Automatische E-Mail-Benachrichtigungen
- 📊 Erweiterte Analytics & Berichte
- 📱 SMS-Benachrichtigungen
- 🔄 Automatische Follow-ups
- 📅 Kalenderintegration
- 💰 Preis-/Angebotsrechner
- 📈 Sales-Pipeline-Visualisierung
- 🎯 Lead-Scoring-System

---

## 🛠️ Technische Details

### Backend Stack

- Node.js 22 LTS
- Express 5
- TypeScript 5.9
- PostgreSQL 17.6
- JWT-Authentifizierung
- Bcrypt-Passwort-Hashing

### Frontend Stack

- Angular 20 (NgModule)
- Tailwind CSS 4
- TypeScript 5.9
- RxJS
- Responsive Design

### Sicherheit

- JWT-Token-basierte Authentifizierung
- Passwort-Hashing mit Bcrypt
- HTTP-only Cookies (konfigurierbar)
- CORS-Schutz
- SQL-Injection-Schutz (Parameterized Queries)

---

## 📊 Datenbank-Schema

### Tabellen

1. **leads** - Alle Lead-Informationen
2. **admin_users** - Admin-Benutzer für CRM-Zugriff
3. **crm_notes** - Notizen zu Leads (vorbereitet für zukünftige Features)
4. **crm_activities** - Aktivitätslog (vorbereitet für zukünftige Features)
5. **campaign_stats** - Kampagnen-Statistiken

---

## 🔧 Wartung & Support

### Neuen Admin-Benutzer hinzufügen

```bash
cd Project/backend
npm run create-admin
```

### Backup erstellen

```bash
pg_dump -U postgres rico_tattoo_db > backup_$(date +%Y%m%d).sql
```

### Backup wiederherstellen

```bash
psql -U postgres rico_tattoo_db < backup_20250101.sql
```

### Logs prüfen

Backend-Logs werden in der Konsole angezeigt, wo der Backend-Server läuft.

---

## 🎯 Quick Start Checkliste

- [ ] PostgreSQL installiert und läuft
- [ ] Datenbank `rico_tattoo_db` erstellt
- [ ] Schema importiert (`database.sql`)
- [ ] Backend `.env` konfiguriert
- [ ] Admin-Benutzer erstellt (`npm run create-admin`)
- [ ] Backend gestartet (`npm run dev`)
- [ ] Frontend gestartet (`ng serve`)
- [ ] Admin-Login getestet (`/admin/login`)
- [ ] Test-Lead erstellt über öffentliches Formular
- [ ] Lead im Dashboard sichtbar

---

## 📞 Support & Erweiterungen

Für zusätzliche Features oder Anpassungen, kontaktieren Sie den Entwickler.

**Aktuelle Version:** 1.0.0 - Minimal CRM (150€ Wert)

---

## 🎨 Branding

Alle UI-Elemente verwenden das Rico Tattoo Artist Branding:

- Dunkles Theme (Zinc-Farbpalette)
- Rot-Akzente (#DC2626)
- Professionelles, modernes Design
- Deutsche Sprache
