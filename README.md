#  Localize - Hyper-Local Notice Board

A modern, anonymous PWA (Progressive Web App) that connects people within a 1km radius through location-based posts and real-time commenting. Built with React, TypeScript, and Supabase.

![Localize PWA](https://img.shields.io/badge/PWA-Ready-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

##  Features

###  Core Features
- **Hyper-Local**: Connect with people within 1km radius only
- **Anonymous Posting**: Share without revealing your identity
- **Real-Time Updates**: See new posts and comments instantly
- **Authentication**: Secure login while maintaining anonymity
- **Categories**: Events, For Sale, Help Needed, and Recommendations

###  PWA Features
- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Get notified of nearby activity
- **Responsive Design**: Optimized for all screen sizes

###  Technical Features
- **Dark/Light Mode**: Automatic theme switching
- **Geolocation**: GPS and manual address input
- **Comments System**: Engage with posts through threaded discussions
- **Owner Controls**: Delete your own posts and comments
- **Performance Optimized**: Fast loading with code splitting

*Note: You'll need to grant location permissions to see the full functionality.*

##  Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Tailwind Forms + Tailwind Typography
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth, Database, Real-time)
- **Database**: PostgreSQL with Row Level Security
- **PWA**: Vite PWA Plugin + Workbox
- **Maps**: OpenStreetMap Nominatim API

##  Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```
git clone https://github.com/rajanarahul93/localize.git
cd localize
```

### 2. Install Dependencies
```
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup
1. Create a new Supabase project
2. Run the database schema (see `database-schema.sql`)
3. Enable Email authentication
4. Configure Site URL in Auth settings

### 5. Run Development Server
```
npm run dev
```

Visit `http://localhost:5173` to see the app.

##  Security & Privacy

- **Anonymous by Design**: User identities are never exposed in the UI
- **Row Level Security**: Database-level access control
- **Location Privacy**: Only approximate distances are shown
- **Secure Authentication**: Supabase Auth with JWT tokens
- **HTTPS Only**: All communications encrypted

## Development

### Available Scripts
```
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Components
- **AuthPage**: Login/signup interface
- **LandingPage**: Location permission request
- **MainFeed**: Post listing with filters
- **CreatePostModal**: New post creation
- **CommentsList**: Real-time comments
- **SettingsDrawer**: App preferences

##  Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for type safety
- Follow React hooks patterns
- Maintain responsive design
- Add proper error handling
- Include loading states
- Write meaningful commit messages

##  Support

If you encounter any issues or have questions:
 **Contact**: rajanarahul93@gmail.com

**Made with ❤️ for building stronger local communities**

*Connect. Share. Engage. Locally.*