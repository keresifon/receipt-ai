# Deployment Checklist for no-wahala.net

## 🚀 Pre-Deployment Setup

### 1. Domain Configuration
- [ ] **DNS Records**: Point `no-wahala.net` to your hosting provider
- [ ] **Subdomain**: Consider setting up `www.no-wahala.net` as well
- [ ] **SSL Certificate**: Ensure HTTPS is enabled (Let's Encrypt or hosting provider SSL)

### 2. Environment Variables
Update your `.env.local` file with production values:

```env
# Production URLs
NEXTAUTH_URL=https://no-wahala.net
SITE_URL=https://no-wahala.net
NEXT_PUBLIC_SITE_URL=https://no-wahala.net

# Database
MONGODB_URI=your_production_mongodb_uri

# Authentication
NEXTAUTH_SECRET=your_strong_production_secret

# Email Service
RESEND_API_KEY=your_resend_api_key
```

### 3. MongoDB Atlas
- [ ] **Production Cluster**: Ensure MongoDB Atlas is configured for production
- [ ] **Network Access**: Allow connections from your hosting provider's IP range
- [ ] **Database User**: Create a production database user with appropriate permissions
- [ ] **Indexes**: Run `npm run create-indexes` in production

## 🌐 Hosting Platform Setup

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add NEXTAUTH_URL
vercel env add SITE_URL
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add RESEND_API_KEY
```

### Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify
# Set environment variables in Netlify dashboard
```

### Self-Hosted
```bash
# Build the project
npm run build

# Start production server
npm start

# Use PM2 for process management
pm2 start npm --name "no-wahala" -- start
```

## 🔧 Post-Deployment Configuration

### 1. Verify Domain
- [ ] **HTTPS**: Confirm SSL certificate is working
- [ ] **DNS**: Verify domain resolves correctly
- [ ] **Redirects**: Ensure `www` redirects to root domain

### 2. Test Core Functionality
- [ ] **Authentication**: Test sign up, sign in, sign out
- [ ] **Receipt Upload**: Test OCR functionality
- [ ] **Dashboard**: Verify analytics display correctly
- [ ] **Email Invitations**: Test family member invitations
- [ ] **Mobile Responsiveness**: Test on various devices

### 3. Performance Optimization
- [ ] **Image Optimization**: Ensure Unsplash images load quickly
- [ ] **Bundle Size**: Check if build is optimized
- [ ] **Database Queries**: Monitor MongoDB performance
- [ ] **Caching**: Implement appropriate caching strategies

## 📧 Email Configuration

### Resend Setup
1. **Domain Verification**: Verify `no-wahala.net` in Resend dashboard
2. **From Address**: Update from `onboarding@resend.dev` to `hello@no-wahala.net`
3. **API Key**: Ensure production API key is set
4. **Email Templates**: Test invitation emails in production

### Email Template Updates
```typescript
// Update in app/api/accounts/[id]/invites/route.ts
from: 'hello@no-wahala.net', // Instead of onboarding@resend.dev
```

## 🔒 Security Checklist

- [ ] **Environment Variables**: All sensitive data is in environment variables
- [ ] **HTTPS Only**: No HTTP endpoints exposed
- [ ] **CORS**: Configure CORS for production domain
- [ ] **Rate Limiting**: Implement API rate limiting
- [ ] **Input Validation**: All user inputs are validated
- [ ] **Authentication**: JWT tokens are properly secured

## 📊 Monitoring & Analytics

### 1. Application Monitoring
- [ ] **Error Tracking**: Set up error monitoring (Sentry, LogRocket)
- [ ] **Performance**: Monitor Core Web Vitals
- [ ] **Uptime**: Set up uptime monitoring

### 2. Database Monitoring
- [ ] **MongoDB Atlas**: Enable monitoring and alerts
- [ ] **Query Performance**: Monitor slow queries
- [ ] **Connection Pool**: Monitor connection usage

### 3. User Analytics
- [ ] **Google Analytics**: Set up GA4 for no-wahala.net
- [ ] **User Behavior**: Track key user actions
- [ ] **Conversion**: Monitor sign-up to active user conversion

## 🚨 Emergency Procedures

### Rollback Plan
```bash
# If deployment fails, rollback to previous version
git checkout HEAD~1
npm run build
npm start
```

### Database Backup
```bash
# Create MongoDB backup before major changes
mongodump --uri="your_mongodb_uri" --out=backup_$(date +%Y%m%d)
```

## 📞 Support & Maintenance

### 1. Documentation
- [ ] **User Guide**: Create user documentation
- [ ] **API Docs**: Document API endpoints
- [ ] **Troubleshooting**: Common issues and solutions

### 2. Support Channels
- [ ] **Email**: support@no-wahala.net
- [ ] **Issues**: GitHub issues for bug reports
- [ ] **FAQ**: Common questions and answers

### 3. Maintenance Schedule
- [ ] **Weekly**: Check error logs and performance
- [ ] **Monthly**: Review security updates and dependencies
- [ ] **Quarterly**: Performance review and optimization

## ✅ Final Checklist

Before going live:
- [ ] All environment variables are set correctly
- [ ] Domain is pointing to the correct hosting provider
- [ ] SSL certificate is active
- [ ] Database is accessible and indexed
- [ ] Email service is configured
- [ ] Core functionality is tested
- [ ] Mobile responsiveness is verified
- [ ] Error monitoring is set up
- [ ] Backup procedures are in place
- [ ] Support channels are established

---

**🎉 Congratulations!** Your no-wahala.net site is now ready for production use.

For ongoing support and updates, refer to the main README.md file.
