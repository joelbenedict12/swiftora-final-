# Vercel Deployment Instructions for Swiftora

## ⚡ Quick Start - Deployment Steps

### Step 1: Prepare Your Project
The project is ready for deployment. Here's what we've configured:

✅ **Build Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Automatic SPA routing configured

✅ **Environment Variables Setup:**
- Vite config updated to use environment variables in production
- Vercel.json configured with proper routes

### Step 2: Deploy via Vercel Web Dashboard

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository:**
   - Connect your GitHub account (if not already connected)
   - Select the Swiftora-Frontend repository
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** swiftora-frontend (or your preferred name)
   - **Framework Preset:** Vite
   - **Root Directory:** ./ (leave as is)
   - **Build Command:** npm run build
   - **Output Directory:** dist
   - **Install Command:** npm install

4. **Set Environment Variables:**
   Click "Environment Variables" and add:
   
   ```
   VITE_API_URL = https://your-backend-api.vercel.app/api
   VITE_DELHIVERY_API_KEY = 0a663b6ad8e1a4903b0397757e5a4efdb5466306
   ```
   
   **Note:** Replace `https://your-backend-api.vercel.app/api` with your actual backend API URL

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Step 3: Configure Backend Integration

Your frontend needs a backend API. You have these options:

#### Option A: Deploy Backend to Vercel (Recommended)
The backend is in `/server` directory. Create separate Vercel project:

1. Push the entire repository to GitHub
2. Create new Vercel project pointing to same repo
3. Set Root Directory to: `server/`
4. Set Build Command to: `npm run build`
5. Set Start Command to: `npm start`

#### Option B: Use Existing Backend
If you already have a backend running:
- Update `VITE_API_URL` environment variable in step 4 above to point to your backend

### Step 4: Environment Variables Reference

For production deployment, ensure these environment variables are set:

**Frontend (.env.production):**
```
VITE_API_URL=https://your-api-domain.com/api
VITE_DELHIVERY_API_KEY=your_delhivery_api_key
```

**Backend (.env):**
```
DATABASE_URL=your_postgresql_database_url
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
DELHIVERY_API_KEY=0a663b6ad8e1a4903b0397757e5a4efdb5466306
DELHIVERY_CLIENT_ID=your_delhivery_client_id
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

## 🔍 Verification Checklist

After deployment, verify these functionalities:

### Frontend Features:
- [ ] Landing page loads and animations work
- [ ] Navigation between pages works
- [ ] Login/Register page displays correctly
- [ ] Mobile responsive design works

### API Integration:
- [ ] Login API calls work
- [ ] Dashboard loads with data
- [ ] Orders can be created
- [ ] Tracking page works
- [ ] All API endpoints respond correctly

### Features to Test:
- [ ] User Authentication (Login/Register/Logout)
- [ ] Order Creation (B2C and B2B)
- [ ] Order Tracking
- [ ] Dashboard Analytics
- [ ] Rate Calculator
- [ ] Pincode Serviceability
- [ ] Pickup Management
- [ ] RTO Predictor

## 🆘 Troubleshooting

### Build Fails
- Check `npm run build` runs locally without errors
- Verify all dependencies are in package.json
- Check Node.js version compatibility

### API Calls Return 404
- Verify `VITE_API_URL` environment variable is set correctly
- Check backend API is running and accessible
- Verify CORS is properly configured on backend

### Pages Show Blank/White Screen
- Check browser console for errors (F12 → Console)
- Verify environment variables are set correctly
- Check that API calls are succeeding in Network tab

### Authentication Issues
- Ensure JWT token is being stored in localStorage
- Verify API endpoints for login are correct
- Check token refresh mechanism is working

## 📊 Performance Optimization Notes

The build generates 1.4MB+ JavaScript (397KB gzipped). This is acceptable for a full-featured admin dashboard but could be optimized further by:
- Lazy loading dashboard components
- Code splitting for heavy components
- Route-based splitting with React.lazy()

## 🔐 Security Notes

Before deploying to production:
- [ ] Change DELHIVERY_API_KEY if it's exposed
- [ ] Generate new JWT_SECRET for production
- [ ] Update database credentials to production values
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Configure CORS properly
- [ ] Set secure cookie flags on backend
- [ ] Use environment variables for all secrets (never commit .env)

## 📝 Additional Resources

- Vercel Docs: https://vercel.com/docs
- Vite Deployment: https://vitejs.dev/guide/static-deploy.html
- React Router Vercel: https://vercel.com/docs/frameworks/react/router

---

**Need Help?**
- Vercel Support: https://vercel.com/support
- Check deployment logs in Vercel Dashboard → Project Settings → Deployments
