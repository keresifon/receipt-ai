# No-wahala.net - Smart Family Receipt Management

Transform your receipt management with AI-powered insights and family collaboration. Track expenses, analyze spending patterns, and manage household finances together.

## Features

- **AI-Powered OCR**: Simply take a photo of your receipt and let our AI extract all the details automatically
- **Smart Analytics**: Get insights into your spending patterns with beautiful charts and detailed reports
- **Family Sharing**: Share expenses with family members and manage household finances together
- **Multi-Tenant Accounts**: Create family accounts with role-based access control (admin, member, viewer)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Bootstrap 5
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js with JWT sessions
- **AI/OCR**: Google Gemini 1.5 Flash
- **Email**: Resend
- **Styling**: Custom CSS with red and black theme

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- MongoDB Atlas account
- Google Gemini API key
- Resend API key (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd receipt-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Fill in your environment variables in `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=expenses
NEXTAUTH_SECRET=your_nextauth_secret
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

### Environment Switching

The application supports easy switching between development (localhost) and production (no-wahala.net) modes through command-line scripts:

#### 🌐 **Production Mode**
- Sets `NEXTAUTH_URL=https://no-wahala.net`
- Sets `SITE_URL=https://no-wahala.net`
- Perfect for when running via Cloudflare or production deployment

#### 💻 **Development Mode**
- Sets `NEXTAUTH_URL=http://localhost:3000`
- Sets `SITE_URL=http://localhost:3000`
- Ideal for local development and testing

#### 🔄 **How to Use**

**Option 1: NPM Scripts (Recommended)**
```bash
# Switch to development mode (localhost:3000)
npm run env:dev

# Switch to production mode (no-wahala.net)
npm run env:prod
```

**Option 2: Direct Script**
```bash
# Switch to development mode
node scripts/switch-env.js dev

# Switch to production mode
node scripts/switch-env.js prod
```

#### 📝 **Important Notes**
- Environment changes are automatically saved to `.env.local`
- Always restart your development server after switching environments
- Perfect for Cloudflare development where you need to switch between local and domain URLs
- No UI components - clean command-line approach

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Create an account and start managing your receipts!

## Deployment

### Production Environment Variables

For production deployment, ensure these environment variables are set:

```env
NEXTAUTH_URL=https://no-wahala.net
SITE_URL=https://no-wahala.net
MONGODB_URI=your_production_mongodb_uri
NEXTAUTH_SECRET=your_production_secret
RESEND_API_KEY=your_resend_api_key
```

### Domain Configuration

1. **DNS Setup**: Point your domain `no-wahala.net` to your hosting provider
2. **SSL Certificate**: Ensure HTTPS is enabled
3. **Environment Variables**: Update all URLs to use `https://no-wahala.net`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@no-wahala.net or create an issue in this repository.

---

Built with ❤️ for families who want to manage their finances smarter.
