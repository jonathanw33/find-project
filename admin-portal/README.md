# FIND System - Admin Portal

This is the administrative web portal for the FIND tracking system. It allows administrators to monitor trackers, manage lost device recovery, and oversee the system.

## Features

- **Dashboard**: View system overview with key metrics
- **Tracker Management**: Monitor all trackers in the system
- **User Management**: View user accounts and their trackers
- **Recovery Management**: Handle logistics for returning lost trackers to users
- **Administrative Functions**: Settings and configuration

## Tech Stack

- Next.js for the frontend framework
- React for UI components
- Supabase for backend services and authentication
- Tailwind CSS for styling
- Lucide React for icons
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Supabase account and project set up

### Installation

1. Clone the repository
   ```
   git clone https://github.com/your-username/find-project.git
   cd find-project/admin-portal
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn
   ```

3. Set up environment variables
   ```
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` to add your Supabase URL and anon key.

4. Start the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The admin portal can be deployed to Vercel, Netlify, or any other hosting platform that supports Next.js.

```
npm run build
npm run start
```

## Project Structure

```
admin-portal/
├── public/               # Static files
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Page layouts (Admin layout)
│   ├── pages/            # Page components and API routes
│   ├── services/         # API and service integrations
│   ├── styles/           # CSS and style files
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── .env.local.example    # Example environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Node.js dependencies
└── tsconfig.json         # TypeScript configuration
```

## Main Features

### Dashboard

The dashboard provides a high-level overview of the system, showing:
- Total users and trackers
- Connected vs. disconnected trackers
- Recent alerts
- Battery status of trackers
- Quick links to common actions

### Tracker Management

Administrators can:
- View all trackers in the system
- Filter by status (connected, disconnected, lost)
- View tracker details (battery, last seen location, connection status)
- Initiate recovery process for lost trackers

### Recovery Management

For lost trackers, administrators can:
- Create new recovery requests
- Track shipment status
- Update shipping information
- View recovery history

## Admin Authentication

This portal uses Supabase for authentication. To set up an admin user:

1. Create a user in the Supabase authentication system
2. Add the user to the `admin_users` table with appropriate permissions
3. The user can then log in to the admin portal

## Integration with Mobile App

The admin portal connects to the same Supabase backend as the mobile app, allowing administrators to:
- View data from all users' trackers
- Monitor the overall system health
- Manage recovery logistics for lost trackers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request