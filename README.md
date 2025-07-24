# NetworkF2 - Modern Web App Boilerplate

A modern, full-featured web application boilerplate built with **Vite**, **React**, **TypeScript**, and **Tailwind CSS 4.1**. Structured for easy integration of LinkedIn social login and backend functionality.

## 🚀 Features

- ⚡ **Vite** - Lightning fast development and build tool
- ⚛️ **React 18** with TypeScript for type-safe development
- 🎨 **Tailwind CSS 4.1** - Modern utility-first CSS framework
- 🔒 **Authentication Ready** - Pre-built auth context and LinkedIn OAuth integration
- 📧 **Email Service** - Ready-to-use email sending functionality
- 🏗️ **Modern Architecture** - Clean folder structure with separation of concerns
- 📱 **Responsive Design** - Mobile-first approach with beautiful UI components
- 🔧 **Developer Experience** - ESLint, TypeScript, and Hot Module Replacement

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   └── ui/              # Basic UI components (Button, Input, etc.)
├── contexts/            # React contexts (Auth, Theme, etc.)
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── services/            # API services and business logic
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── config/              # Configuration files
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual values:
   - `VITE_LINKEDIN_CLIENT_ID`: Your LinkedIn App Client ID
   - `VITE_API_URL`: Your backend API URL

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🔐 LinkedIn OAuth Setup

1. **Create a LinkedIn App:**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create a new app and get your Client ID
   - Add `http://localhost:5173/auth/linkedin/callback` to authorized redirect URLs

2. **Update environment variables:**
   ```env
   VITE_LINKEDIN_CLIENT_ID=your_actual_client_id
   VITE_LINKEDIN_REDIRECT_URI=http://localhost:5173/auth/linkedin/callback
   ```

## 📧 Email Integration

The email service is ready to integrate with your backend API. The service includes:

- Welcome emails for new users
- Password reset functionality
- Contact form submissions
- Generic email sending capability

### Backend API Requirements

Your backend should provide these endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/linkedin/callback` - LinkedIn OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/email/send` - Send email

## 🎨 Customization

### Tailwind CSS

The project uses Tailwind CSS 4.1 with the new Vite plugin. All styles are utility-first and easily customizable.

### Components

All components are built with:
- TypeScript for type safety
- Tailwind CSS for styling
- Proper accessibility features
- Responsive design patterns

### Theme Colors

The default theme uses:
- Primary: Blue (600/700)
- Secondary: Gray (200/300)
- Success: Green
- Error: Red

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example implementations

---

Built with ❤️ using modern web technologies.
