# 🚀 Quick Deployment Checklist

Follow these steps in order to deploy your ShopZone E-Commerce platform.

---

## ✅ Pre-Deployment Checklist

- [x] Code updated with environment variable support
- [x] CORS configured for production
- [x] `.env` files created for frontend and backend
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas account created

---

## 📋 Step-by-Step Deployment

### Step 1: Setup MongoDB Atlas (15 mins)
1. ✅ Sign up at https://www.mongodb.com/cloud/atlas/register
2. ✅ Create a free M0 cluster
3. ✅ Create database user with username and password
4. ✅ Add IP whitelist (0.0.0.0/0 for now)
5. ✅ Get connection string
6. ✅ Test connection locally by updating `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/Ecommerce2
   ```
7. ✅ Restart backend and verify it connects

### Step 2: Deploy Backend to Render (20 mins)
1. ✅ Go to https://render.com and sign up
2. ✅ New → Web Service
3. ✅ Connect GitHub repo
4. ✅ Configure:
   - Name: `shopzone-backend` (or your preferred name)
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free

5. ✅ Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/Ecommerce2
   JWT_SECRET=your_production_secret_here
   JWT_EXPIRES_IN=7d
   PORT=5000
   ```

6. ✅ Deploy and wait (~5-10 mins)
7. ✅ Copy your backend URL (e.g., `https://shopzone-backend.onrender.com`)
8. ✅ Test: Visit `https://shopzone-backend.onrender.com/api/products`

### Step 3: Deploy Frontend to Vercel (15 mins)
1. ✅ Update `.env.production` with your backend URL:
   ```
   VITE_API_URL=https://shopzone-backend.onrender.com
   ```

2. ✅ Push changes to GitHub

3. ✅ Go to https://vercel.com and sign up with GitHub

4. ✅ Import your repository

5. ✅ Configure:
   - Framework: Vite
   - Root Directory: `./` (leave empty)
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. ✅ Add Environment Variable:
   ```
   VITE_API_URL=https://shopzone-backend.onrender.com
   ```

7. ✅ Deploy (~2-3 mins)

8. ✅ Copy your frontend URL (e.g., `https://shopzone.vercel.app`)

### Step 4: Update CORS Configuration (5 mins)
1. ✅ Go back to Render dashboard
2. ✅ Add environment variable:
   ```
   FRONTEND_URL=https://shopzone.vercel.app
   ```
3. ✅ Redeploy backend

### Step 5: Test Your Deployed App (10 mins)
Test these features:
- [ ] Visit your Vercel URL
- [ ] Register a new user
- [ ] Login
- [ ] Browse products
- [ ] Add items to cart
- [ ] Checkout
- [ ] View orders
- [ ] Test gamification (points, achievements)
- [ ] Test price tracking
- [ ] Login as admin (if you have admin account)

---

## 🔧 Environment Variables Summary

### Backend (Render):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Ecommerce2
JWT_SECRET=your_production_secret
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel):
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🚨 Common Issues

### Issue: "Network Error" or "Failed to fetch"
**Solution**: 
- Check CORS settings in backend
- Verify VITE_API_URL is set correctly
- Check browser console for actual error

### Issue: "Invalid token" or auth errors
**Solution**:
- Clear browser cookies/localStorage
- Re-register/login
- Check JWT_SECRET is set in Render

### Issue: Backend returns 502/503
**Solution**:
- Free tier on Render sleeps after 15 mins
- First request takes ~30 seconds to wake up
- Check Render logs for errors

### Issue: MongoDB connection failed
**Solution**:
- Verify IP whitelist in Atlas
- Check username/password in connection string
- Ensure database name is included

---

## 📊 Post-Deployment

### Monitor Performance:
- Render Dashboard: Check logs and uptime
- Vercel Analytics: View traffic and performance
- MongoDB Atlas: Monitor database usage

### Optimize:
- Add indexes to frequently queried fields
- Enable Redis caching (if needed)
- Compress images
- Consider upgrading to paid tiers for production traffic

---

## 🎉 Success!

Your app is now live at:
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.onrender.com
- **Admin Panel**: https://your-app.vercel.app/admin

Share your deployed app and enjoy! 🚀

---

Need detailed instructions? See `DEPLOYMENT.md`
