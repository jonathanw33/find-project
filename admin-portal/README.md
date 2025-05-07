# FIND System - Admin Portal

This directory will contain the web-based administration portal for the FIND system. The admin portal will be developed in Phase 4 of the project.

## Planned Features

- User account management
- Tracker monitoring and administration
- Lost item recovery logistics
- System analytics and reporting
- Configuration management

## Technology Stack

- React.js for frontend
- Supabase for backend services
- Tailwind CSS for styling
- Next.js for server-side rendering
- Chart.js for analytics visualizations

## Development Setup (Future)

1. Install Node.js (v14 or later)
2. Clone this repository
3. Navigate to the admin-portal directory
4. Run `npm install` to install dependencies
5. Run `npm run dev` to start the development server

## Project Structure (Planned)

```
admin-portal/
├── public/               # Static files
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layouts
│   ├── pages/            # Page components
│   ├── services/         # API and service integrations
│   ├── styles/           # CSS and style files
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── .env.example          # Example environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Node.js dependencies
└── tsconfig.json         # TypeScript configuration
```

## Screens and Features

### Authentication
- Login screen
- Password reset
- Two-factor authentication

### Dashboard
- System overview
- Active trackers count
- Recent alerts
- Recovery requests

### User Management
- List of users
- User details and edit
- Account creation
- Permissions management

### Tracker Management
- List of all trackers
- Tracker details and status
- Location history
- Remote commands (alert, factory reset)

### Recovery Management
- Pending recovery requests
- Request details
- Logistics coordination
- Status updates

### Analytics
- Usage statistics
- Battery life analytics
- Lost item patterns
- System performance

### Settings
- System configuration
- Email notifications
- Integration settings
- Backup and restore

## Integration Points

- Mobile app API
- Supabase backend
- Logistics partners API
- Notification services