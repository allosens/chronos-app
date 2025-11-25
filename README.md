# ⏰ Chronos - Time Tracking App

**Chronos** is a modern, minimalist time tracking application built with Angular 20 and Tailwind CSS. Designed for productivity-focused professionals who need a clean, efficient way to track their work hours, breaks, and daily progress.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication**: Complete token-based auth system with auto-refresh
- **Session Management**: Configurable timeout with user warnings
- **Role-Based Access**: Support for Super Admin, Company Admin, and Employee roles
- **Multi-Tenant**: Company-level data isolation
- **SSR Compatible**: Secure authentication that works with server-side rendering

### 🕐 Core Time Tracking
- **Real-time Timer**: HH:MM:SS format with live updates
- **Work Sessions**: Start/stop work periods with automatic persistence
- **Break Management**: Track break time separately from work hours
- **Daily Summary**: Visual progress tracking with statistics

### 🎨 User Experience
- **Responsive Design**: Optimized layouts for mobile, tablet, and desktop
- **Two-Column Layout**: Efficient space usage on larger screens
- **Status Indicators**: Visual feedback for working, break, and idle states
- **Progress Visualization**: Daily goal tracking with progress bars

### 🛠️ Technical Features
- **Reactive State Management**: Built with Angular Signals for optimal performance
- **Local Persistence**: Automatic session saving with localStorage
- **SSR Compatible**: Server-side rendering support
- **TypeScript**: Full type safety throughout the application

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Angular CLI 20+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/allosens/chronos-app.git
   cd chronos-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API endpoints
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200/`

5. **Login**
   Use your credentials to access the application. See [Authentication System](docs/auth-system.md) for details.

## 🔐 Authentication

The application includes a complete JWT authentication system with:
- Real API integration with backend
- Automatic token refresh before expiration
- Session timeout with warnings (30 min default)
- Idle timeout detection (15 min default)
- Multi-tenant company context
- Role-based access control

For complete documentation, see [Authentication System Guide](docs/auth-system.md).

### API Endpoints Required

Your backend should implement:
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - Session termination

See the [auth documentation](docs/auth-system.md) for complete API specifications.

## 📱 Usage

### Starting Your Workday
1. Click **"Start Work Day"** to begin tracking time
2. The timer will show your active work time in HH:MM:SS format
3. Your session is automatically saved and persists across browser refreshes

### Taking Breaks
1. Click **"Take a Break"** to pause work time tracking
2. Break time is tracked separately and doesn't count toward work hours
3. Click **"Resume Work"** to continue your work session

### Daily Summary
- View total worked hours and break time
- Track progress toward your 8-hour daily goal
- See session start times and current status
- Visual progress bar shows completion percentage

## 🏗️ Architecture

### Project Structure
```
src/app/
├── core/
│   ├── services/
│   │   ├── token.service.ts          # JWT token management
│   │   └── token-refresh.service.ts  # Auto-refresh logic
│   └── interceptors/
│       └── auth.interceptor.ts       # HTTP request auth
├── features/
│   ├── auth/
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Main auth service
│   │   │   └── session.service.ts    # Session management
│   │   ├── guards/
│   │   │   ├── auth.guard.ts         # Route protection
│   │   │   └── role.guard.ts         # Role-based access
│   │   └── models/
│   │       ├── auth.model.ts         # Auth interfaces
│   │       └── api.model.ts          # API interfaces
│   └── time-tracking/
│       ├── components/
│       │   ├── clock-in-out/         # Timer and controls
│       │   └── history-viewer/       # Daily summary
│       ├── models/                   # TypeScript interfaces
│       ├── services/                 # Business logic
│       └── pages/                    # Route components
├── layout/                           # App shell components
├── shared/
│   └── utils/                        # DateUtils and helpers
└── app.routes.ts                     # Route configuration
```

### Key Technologies
- **Angular 20**: Latest features including Signals and SSR
- **Tailwind CSS**: Utility-first styling approach
- **TypeScript**: Type-safe development
- **RxJS Signals**: Reactive state management
- **PostCSS**: CSS processing and optimization

## 🎯 Development

### Code Quality
- **Shared Utilities**: Centralized `DateUtils` for consistent time formatting
- **Component Separation**: Clean separation of concerns
- **Type Safety**: Full TypeScript coverage
- **Responsive Design**: Mobile-first approach with desktop optimization

### Building for Production
```bash
npm run build
# or
ng build --configuration production
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (when configured)
npm run e2e
```

## 📋 Roadmap

### Planned Features
- [ ] Weekly and monthly time reports
- [ ] Project-based time tracking
- [ ] Time goals and productivity insights
- [ ] Export functionality (CSV, PDF)
- [ ] Team collaboration features
- [ ] Integration with popular project management tools

### Technical Improvements
- [ ] PWA capabilities for offline use
- [ ] Dark mode theme
- [ ] Keyboard shortcuts
- [ ] Data export/import
- [ ] Advanced analytics dashboard

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Alex** - [@allosens](https://github.com/allosens)

---

**⭐ Star this repository if you find it useful!**

Built with ❤️ using Angular and Tailwind CSS
