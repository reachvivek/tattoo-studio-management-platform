# 🎨 Tattoo Studio Management Platform

A comprehensive, production-ready platform for managing tattoo studio operations including lead generation, customer relationship management, automated communications, and real-time analytics.

## ✨ Features

### Lead Generation & Capture
- **Elegant Landing Page**: Modern dark-themed UI with Tailwind CSS 4
- **Multi-step Form**: Capture customer details, tattoo descriptions, and reference photos
- **File Upload**: Support for multiple image uploads (max 5 images, 10MB each)
- **Campaign Analytics**: Real-time tracking of lead conversions and remaining slots
- **Gamification**: Lottery-style discount system (configurable discount percentages)

### Customer Relationship Management (CRM)
- **Lead Management**: Track leads from capture to conversion
- **Status Tracking**: Customizable lead statuses (new, contacted, qualified, converted, rejected)
- **Notes & Activities**: Built-in activity logging and note-taking system
- **UTM Tracking**: Automatic capture of campaign sources and marketing attribution

### Automation & Integration
- **Email Automation**: Gmail SMTP integration with customizable templates
- **WhatsApp Integration**: Automated WhatsApp messaging (integration-ready)
- **Real-time Notifications**: Instant lead alerts and status updates
- **Scheduled Campaigns**: Support for time-based marketing campaigns

### Analytics & Reporting
- **Real-time Dashboard**: Live statistics and conversion metrics
- **Campaign Performance**: Track success rates and ROI
- **Lead Sources**: UTM parameter tracking for marketing attribution
- **Export Capabilities**: Data export for external analysis

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 20 (NgModule architecture)
- **Styling**: Tailwind CSS 4 (PostCSS)
- **Language**: TypeScript 5.9
- **HTTP Client**: RxJS-based reactive services
- **Form Validation**: Angular Reactive Forms
- **Routing**: Lazy-loaded feature modules

### Backend
- **Runtime**: Node.js 22 LTS
- **Framework**: Express 5
- **Language**: TypeScript
- **Database**: PostgreSQL 17.6
- **File Upload**: Multer middleware
- **Email**: Nodemailer with Gmail SMTP
- **Validation**: Custom validators with Joi-style patterns

### Database Schema
- **Tables**: leads, crm_notes, crm_activities, campaign_stats, admin_users
- **Indexes**: Optimized for email, status, and timestamp queries
- **Triggers**: Automatic timestamp updates
- **Constraints**: Data integrity and relationship enforcement

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ LTS
- PostgreSQL 17.6+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/reachvivek/tattoo-studio-management-platform.git
cd tattoo-studio-management-platform
```

2. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. **Database setup**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE rico_tattoo_db;"

# Run schema
psql -U postgres -d rico_tattoo_db -f backend/schemas/database.sql
```

4. **Environment configuration**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
```

5. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
ng serve
```

6. **Access the application**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## 📁 Project Structure

```
tattoo-studio-management-platform/
├── frontend/                    # Angular 20 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Singleton services, models
│   │   │   ├── features/       # Feature modules (lazy-loaded)
│   │   │   │   ├── lead-form/  # Lead capture components
│   │   │   │   └── thank-you/  # Confirmation page
│   │   │   ├── shared/         # Reusable components
│   │   │   └── environments/   # Environment configs
│   │   └── styles.css          # Global Tailwind styles
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── routes/                 # API endpoints
│   ├── models/                 # TypeScript interfaces
│   ├── middleware/             # Express middleware
│   ├── config/                 # Configuration files
│   ├── schemas/                # Database schemas
│   └── package.json
│
└── README.md
```

## 🔧 Configuration

### Frontend Environment Variables
Located in `frontend/src/environments/`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  whatsappNumber: '+49 xxx xxx xxxx',
  whatsappLink: 'https://wa.me/...',
  totalSlots: 100
};
```

### Backend Environment Variables
Located in `backend/.env`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rico_tattoo_db
DB_USER=postgres
DB_PASSWORD=your_password

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# WhatsApp (Optional)
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE=+49xxxxxxxxxx

# Server
PORT=3000
NODE_ENV=development
```

## 🎨 Customization

### Branding & Styling
- **Colors**: Edit `frontend/src/styles.css` CSS variables
- **Logo**: Replace `frontend/public/favicon.ico`
- **Images**: Update hero images in `frontend/public/assets/`
- **Text**: Modify component templates (German language by default)

### Business Logic
- **Discount Percentage**: Adjust in `backend/services/lead.service.ts`
- **Campaign Slots**: Configure in `frontend/src/environments/environment.ts`
- **Form Fields**: Customize in `frontend/src/app/features/lead-form/`

## 📊 API Endpoints

### Lead Management
- `POST /api/leads` - Create new lead
- `GET /api/leads` - List all leads
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Analytics
- `GET /api/analytics/stats` - Get campaign statistics
- `GET /api/analytics/leads` - Get leads with filters

### File Upload
- `POST /api/upload` - Upload reference images

## 🔒 Security Features

- **Input Validation**: Server-side validation for all endpoints
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CORS Configuration**: Restricted origins
- **File Upload Limits**: Size and type restrictions
- **Rate Limiting**: API endpoint protection (ready to implement)

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend
ng test

# Backend tests
cd backend
npm test
```

## 📦 Production Deployment

### Frontend Build
```bash
cd frontend
ng build --configuration production
```

### Backend Build
```bash
cd backend
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production database credentials
- Set up SSL certificates
- Configure reverse proxy (nginx recommended)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Angular 20 and Tailwind CSS 4
- Icons from Heroicons
- Inspired by modern SaaS lead generation platforms

## 📞 Support

For support, email support@yourdomain.com or open an issue on GitHub.

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Co-Authored-By:** Claude <noreply@anthropic.com>
