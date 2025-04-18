# Playgroup Management System

A comprehensive playgroup student management system that automates financial tracking and provides intelligent insights into student payment interactions.

## Features

- 👨‍👩‍👧‍👦 **Student Management**: Complete student profiles with personal and family information
- 💰 **Fee Management**: Track fee structures, payments, and outstanding balances
- 📊 **Financial Reports**: Generate detailed reports on fee collection, expenses, and revenue
- 📅 **Attendance Tracking**: Monitor student attendance and generate attendance reports
- 📦 **Inventory Management**: Keep track of playgroup resources and materials
- 💼 **Expense Tracking**: Record and categorize all expenses for financial analysis
- 🧑‍🏫 **Class Management**: Organize students into classes and batches with assigned teachers
- 📝 **Academic Year Planning**: Plan and manage academic calendar years and terms
- 👥 **User Roles & Permissions**: Control access with customizable user roles
- 📱 **Responsive Design**: Fully responsive interface for both desktop and mobile devices

## Technology Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS for styling
  - Shadcn/ui component library
  - React Query for data fetching
  - React Hook Form for form management
  - Zod for validation

- **Backend**:
  - Express.js server
  - PostgreSQL database
  - Drizzle ORM
  - Passport.js for authentication

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/playgroup-management-system.git
   cd playgroup-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

Once the server is running, access the application at:
```
http://localhost:3000
```

For the first-time setup, create an admin user through the registration page.

## Development

This project follows a modern full-stack JavaScript architecture with:
- TypeScript for type safety
- React for the frontend user interface
- Express for the backend API
- PostgreSQL for data storage
- Drizzle ORM for database operations

## License

[MIT](LICENSE)

## Acknowledgements

- Shadcn/ui for the component library
- TailwindCSS for the styling framework
- Replit for development environment