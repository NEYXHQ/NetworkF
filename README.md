# NetworkF2 - Modern Static Web App with Auth0

A modern, fully static web application built with **Vite**, **React**, **TypeScript**, **Tailwind CSS 4.1**, and **Auth0** for authentication. Perfect for founders and entrepreneurs network with LinkedIn-only authentication.

## 🚀 Features

- ⚡ **Vite** - Lightning fast development and build tool
- ⚛️ **React 18** with TypeScript for type-safe development
- 🎨 **Tailwind CSS 4.1** - Modern utility-first CSS framework
- 🔐 **Auth0 Integration** - Enterprise-grade authentication with LinkedIn
- 📱 **Responsive Design** - Mobile-first approach with beautiful UI components
- 🏗️ **Static Deployment** - Deploy anywhere (Vercel, Netlify, AWS S3, etc.)
- 🔧 **Developer Experience** - ESLint, TypeScript, and Hot Module Replacement

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   └── ui/              # Basic UI components (Button, Input, etc.)
├── contexts/            # React contexts (Auth0 wrapper)
├── pages/               # Page components
├── services/            # Utility services (Email service for future use)
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── config/              # Configuration files
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn package manager
- Auth0 account (free tier available)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Auth0 values:
   ```env
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your_auth0_client_id
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🔐 Auth0 + LinkedIn Setup

### Step 1: Create Auth0 Account and Application

1. **Sign up at [auth0.com](https://auth0.com)** (free tier available)
2. **Create a new Single Page Application**
3. **Configure Application Settings:**
   - Allowed Callback URLs: `http://localhost:5173, https://your-domain.com`
   - Allowed Logout URLs: `http://localhost:5173, https://your-domain.com`
   - Allowed Web Origins: `http://localhost:5173, https://your-domain.com`

### Step 2: Enable LinkedIn Social Connection

1. **Go to Authentication → Social** in Auth0 dashboard
2. **Enable LinkedIn** connection
3. **Configure LinkedIn:**
   - Create a LinkedIn app at [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Add your LinkedIn Client ID and Secret to Auth0
   - Set authorized redirect URL: `https://your-auth0-domain.auth0.com/login/callback`

### Step 3: Update Environment Variables

```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
```

## 🚀 Deployment (100% Static)

This app is completely static and can be deployed anywhere:

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify or use CLI
```

### AWS S3 + CloudFront
```bash
npm run build
# Upload dist/ folder to S3 bucket with static hosting
```

### GitHub Pages
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

## ✨ What Makes This Special

### 🏗️ **Zero Backend Required**
- Auth0 handles all authentication complexity
- No server to maintain or scale
- Deploy as static files anywhere

### 🔒 **Enterprise Security**
- Auth0's SOC 2 Type II certified infrastructure
- LinkedIn OAuth for professional verification
- JWT tokens with automatic refresh

### ⚡ **Lightning Fast**
- Static deployment means instant loading
- CDN-friendly for global performance
- No database queries or server processing

### 🎯 **Founder-Focused**
- LinkedIn-only authentication ensures professional users
- Clean, modern UI designed for networking
- Ready for manual verification workflows

## 🔧 Customization

### Changing Authentication Providers

Want to add more than LinkedIn? Update the Auth0Provider:

```tsx
authorizationParams={{
  // Remove the connection parameter to show all enabled connections
  scope: 'openid profile email',
}}
```

### Styling

All components use Tailwind CSS classes and are easily customizable:

```tsx
// Example: Change primary color from blue to purple
className="bg-purple-600 hover:bg-purple-700"
```

### Adding Features

Since this is a static app, additional features can be added as:
- Client-side only functionality
- Third-party service integrations (Stripe, SendGrid, etc.)
- Serverless functions for specific needs

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🔍 User Verification Workflow

For your founders/entrepreneurs verification:

1. **User signs in with LinkedIn** (handled by Auth0)
2. **You receive user data** including LinkedIn profile
3. **Manual verification process** (implement as needed)
4. **Grant access to features** based on verification status

## 🆘 Troubleshooting

### Auth0 Configuration Issues
- Verify callback URLs include your domain
- Check Auth0 domain and client ID in environment variables
- Ensure LinkedIn connection is properly configured

### Deployment Issues
- Run `npm run build` locally to test production build
- Check that environment variables are set in deployment platform
- Verify Auth0 URLs include your production domain

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check Auth0 documentation for authentication issues
- Review the example implementations in the code
- Create an issue for bugs or feature requests

---

Built with ❤️ for the entrepreneurial community. **Simple. Secure. Static.**
