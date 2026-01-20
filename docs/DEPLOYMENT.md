# Deployment Guide - ShopZone E-Commerce Platform

## Overview
This guide will help you deploy your MERN stack application to production.

**Deployment Stack:**
- Frontend: Vercel (recommended) or Netlify
- Backend: Render (recommended) or Railway
- Database: MongoDB Atlas (free tier)

---

## 1. Setup MongoDB Atlas (Database)

### Steps:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account and new cluster (M0 Free tier)
3. Create a database user:
   - Database Access → Add New Database User
   - Username: `ecommerce_user`
   - Password: Generate secure password (save it!)
   - Role: Atlas admin or Read/Write to any database

4. Whitelist IP addresses:
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add specific IPs for production

5. Get connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<username>` and `<password>` with your credentials
   - Add database name: `mongodb+srv://...mongodb.net/Ecommerce2?retryWrites=true&w=majority`

6. Update your backend `.env`:
   ```
   MONGODB_URI=mongodb+srv://ecommerce_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Ecommerce2?retryWrites=true&w=majority
   ```

---

## 2. Deploy Backend to Render

### Prerequisites:
- Push your code to GitHub
- Make sure `backend/package.json` has a start script

### Steps:

1. **Prepare your backend:**
   - Create `backend/.gitignore` if not exists:
     ```
     node_modules/
     .env
     ```
   
   - Ensure `backend/package.json` has:
     ```json
     {
       "scripts": {
         "start": "node server.js",
         "dev": "nodemon server.js"
       }
     }
     ```

2. **Deploy on Render:**
   - Go to [Render](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `shopzone-backend`
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

3. **Add Environment Variables:**
   Click "Environment" and add:
   ```
   MONGODB_URI=mongodb+srv://ecommerce_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/Ecommerce2?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_production_random_string_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   ```
   
   **Generate secure JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your backend URL: `https://shopzone-backend.onrender.com`

### Alternative: Railway
1. Go to [Railway](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repo and `backend` folder
4. Add environment variables (same as above)
5. Railway auto-detects Node.js and deploys

---

## 3. Deploy Frontend to Vercel

### Prerequisites:
- Backend deployed and URL ready

### Steps:

1. **Update API endpoint:**
   
   Create/update `src/services/api.ts` or wherever you define your API base URL:
   ```javascript
   // Replace localhost with your Render backend URL
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shopzone-backend.onrender.com';
   
   export default API_BASE_URL;
   ```

2. **Create environment variable file:**
   
   Create `.env.production` in root:
   ```
   VITE_API_URL=https://shopzone-backend.onrender.com
   ```

3. **Update package.json build script (if needed):**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

4. **Deploy on Vercel:**
   - Go to [Vercel](https://vercel.com) and sign up with GitHub
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `./` (or leave empty if frontend is in root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

5. **Add Environment Variables:**
   ```
   VITE_API_URL=https://shopzone-backend.onrender.com
   ```

6. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site: `https://your-project.vercel.app`

### Alternative: Netlify
1. Go to [Netlify](https://netlify.com)
2. "Add new site" → "Import from Git"
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables (same as Vercel)
5. Deploy

---

## 4. Important Backend Updates for Production

### Update CORS settings in `backend/server.js`:

```javascript
const cors = require('cors');

// Replace this:
app.use(cors());

// With this:
const corsOptions = {
  origin: [
    'https://your-project.vercel.app',
    'http://localhost:8080', // Keep for local development
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

---

## 5. Post-Deployment Checklist

### Testing:
- [ ] Test user registration/login
- [ ] Test product browsing and search
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test admin panel access
- [ ] Test gamification features
- [ ] Test price tracking
- [ ] Check all API endpoints work

### Security:
- [ ] Change JWT_SECRET to strong random string
- [ ] Enable MongoDB IP whitelist (remove 0.0.0.0/0)
- [ ] Set up proper CORS origins
- [ ] Review exposed environment variables
- [ ] Enable HTTPS (Vercel/Render do this automatically)

### Performance:
- [ ] Enable caching headers
- [ ] Optimize images (use CDN like Cloudinary)
- [ ] Add database indexes for frequently queried fields
- [ ] Monitor backend logs on Render dashboard

---

## 6. Custom Domain (Optional)

### Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your domain (e.g., `shopzone.com`)
3. Update DNS records as instructed

### Render (Backend):
1. Go to Settings → Custom Domains
2. Add subdomain (e.g., `api.shopzone.com`)
3. Update DNS CNAME record

---

## 7. Continuous Deployment

Both Vercel and Render support automatic deployments:
- Push to `main` branch → Automatically deploys
- Pull requests → Preview deployments
- Rollback to previous versions in dashboard

---

## Common Issues & Solutions

### Issue: CORS errors
**Solution**: Update CORS origins in `backend/server.js` to include your Vercel URL

### Issue: MongoDB connection fails
**Solution**: 
- Check MongoDB Atlas IP whitelist
- Verify connection string has correct username/password
- Ensure database name is included in URI

### Issue: Environment variables not working
**Solution**:
- Rebuild the application after adding variables
- Check variable names match exactly (case-sensitive)
- For Vite, prefix with `VITE_`

### Issue: 502 Bad Gateway on backend
**Solution**:
- Check Render logs for errors
- Ensure PORT is set correctly
- Verify MongoDB connection is successful

### Issue: Frontend can't reach backend
**Solution**:
- Verify VITE_API_URL is set correctly
- Check Network tab in browser DevTools
- Ensure backend is running (not sleeping on free tier)

---

## Free Tier Limitations

### Render Free Tier:
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month (sufficient for one app)

### Vercel Free Tier:
- 100 GB bandwidth/month
- Unlimited websites
- Automatic SSL

### MongoDB Atlas Free Tier:
- 512 MB storage
- Shared CPU
- Suitable for development/small projects

---

## Upgrade Recommendations

For production with real traffic, consider:
- **Render**: $7/month for always-on backend
- **MongoDB Atlas**: $9/month (M10) for dedicated cluster
- **Vercel**: Free tier is usually sufficient

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

**Your Application URLs After Deployment:**
- Frontend: `https://your-project.vercel.app`
- Backend API: `https://shopzone-backend.onrender.com`
- Admin Panel: `https://your-project.vercel.app/admin`

Good luck with your deployment! 🚀
