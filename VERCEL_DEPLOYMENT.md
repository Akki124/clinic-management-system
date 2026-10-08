# 🚀 Vercel Deployment Guide — AuraCare Clinic Management System

This project is fully configured for seamless deployment to [Vercel](https://vercel.com) as a unified full-stack application (React SPA + Express Serverless API + Cloud PostgreSQL).

---

## ⚡ Architecture on Vercel

```
                                  ┌──────────────────────────┐
                                  │   Vercel Edge Network    │
                                  └─────────────┬────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
            Static Assets & SPA Routes                         Serverless Function
             `frontend/dist` (Vite)                             `api/index.js`
                       │                                                 │
             (Client-Side Routing)                               (Express REST API)
                                                                         │
                                                                         ▼
                                                               ┌───────────────────┐
                                                               │ Cloud PostgreSQL  │
                                                               │ (Neon / Supabase) │
                                                               └───────────────────┘
```

---

## 📋 Pre-Configured Files in this Repository

All necessary configuration files have already been created and verified:
1. **`vercel.json`**: Configures the build command, output directory (`frontend/dist`), and routing rewrites:
   - `/api/(.*)` ➔ Serverless Express Function (`/api`)
   - `/(.*)` ➔ `index.html` (Vite SPA client routing)
2. **`api/index.js`**: Serverless function entrypoint that loads the Express application.
3. **`backend/src/config/database.js`**: Automatically detects `DATABASE_URL` / `POSTGRES_URL` with SSL enabled for Neon, Supabase, and Vercel Postgres.
4. **`backend/src/app.js`**: Configured to run gracefully in serverless environments.
5. **`frontend/src/api/client.js`**: Automatically uses `/api` relative routing on Vercel or custom `VITE_API_URL`.

---

## 🛠️ Step 1: Create a Free Cloud PostgreSQL Database

Because Vercel serverless functions cannot connect to your local computer (`127.0.0.1:5432`), you need a free cloud PostgreSQL database.

### Recommended: Neon (Takes 60 seconds)
1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Click **Create Project** (e.g., name it `clinic-db`).
3. Under **Connection Details**, copy your connection string:
   ```
   postgresql://neondb_owner:password@ep-something.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Initialize Database Tables:
You have two easy ways to set up the tables and demo data:

**Option A (Using Neon SQL Editor — Fastest):**
1. In your Neon project dashboard, open the **SQL Editor** tab.
2. Open `backend/src/database/schema.sql` from this project, copy all its content, paste it into Neon SQL Editor, and click **Run**.
3. All tables (`users`, `doctors`, `patients`, `appointments`, `visits`, `prescriptions`, `bills`, `clinic_settings`) will be created instantly.

**Option B (From your local terminal):**
```bash
# In the project root:
$env:DATABASE_URL="your-neon-connection-string"
npm run migrate
```

---

## 🌐 Step 2: Deploy to Vercel

### Method A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   # Initialize git remote and push
   git remote add origin https://github.com/<your-username>/clinic-management-system.git
   git branch -M master
   git push -u origin master
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository `clinic-management-system` and click **Import**.

3. **Configure Environment Variables:**
   Under **Environment Variables**, add the following 3 variables:
   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | Your Cloud PostgreSQL connection string |
   | `JWT_SECRET` | `clinic_super_secret_jwt_key_2026_secured!` | Secret key for JWT auth tokens |
   | `NODE_ENV` | `production` | Production mode |

4. **Deploy:**
   - Click **Deploy**.
   - Vercel will build the React frontend and deploy the serverless API.
   - Your live site will be ready at `https://your-project.vercel.app`!

---

### Method B: Deploy using Vercel CLI

If you prefer deploying directly from your computer terminal:

1. Open PowerShell or Terminal in the project root:
   ```bash
   cd C:\Users\Admin\.gemini\antigravity\scratch\clinic-management
   ```
2. Run the Vercel CLI command:
   ```bash
   npx vercel
   ```
3. Follow the interactive prompts:
   - **Log in** with GitHub, GitLab, or Email.
   - **Set up and deploy?** &rarr; `Y`
   - **Which scope?** &rarr; Select your account
   - **Link to existing project?** &rarr; `N`
   - **Project name?** &rarr; `auracare-clinic` (or press Enter)
   - **Directory located?** &rarr; `./` (press Enter)
   - **Want to modify settings?** &rarr; `N` (the included `vercel.json` already configures everything)
4. Add environment variables:
   ```bash
   npx vercel env add DATABASE_URL production
   npx vercel env add JWT_SECRET production
   ```
5. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 🔑 Login Credentials

Once deployed, access your live Vercel URL and sign in with the pre-seeded Super Admin account:

- **Email:** `admin@clinic.com`
- **Password:** `Admin@123`

You have complete Super Admin control to:
- Change clinic branding, contact info, logo, and receipt settings (`/settings`)
- Register doctors, manage OPD consultation fees, and schedule OPD hours
- Manage patients, physical vitals, and homeopathy case-taking records
- Issue electronic prescriptions and generate itemized billing receipts
