# ⚡ Supabase Cloud Database Connection Guide

This guide explains how to create a 100% free cloud PostgreSQL database on **Supabase** and connect it to the **AuraCare Clinic Management System** both locally and on **Vercel**.

---

## 📌 Step 1: Create a Free Database on Supabase

1. Visit **[supabase.com](https://supabase.com)** and sign in (free with GitHub or Email).
2. On your Supabase dashboard, click **New Project**.
3. Fill out the project details:
   - **Name**: `clinic-management-db` (or any name you prefer)
   - **Database Password**: Set a secure password and **write it down** (you will need it in your connection string!).
   - **Region**: Choose a region close to your users (e.g. `South Asia (Mumbai)`, `US East`, `Central Europe`).
   - **Pricing Plan**: **Free** ($0/month).
4. Click **Create new project**. Supabase will take 1–2 minutes to provision your database.

---

## 🔑 Step 2: Get Your Connection String (URI)

1. In your Supabase project dashboard, click the **Project Settings** (gear icon ⚙️) at the bottom of the left sidebar.
2. In the settings menu, select **Database**.
3. Scroll down to the **Connection string** section.
4. Click on the **URI** tab:
   - For **Direct connection**:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```
   - For **Connection Pooling** (Recommended for serverless/Vercel):
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
5. **Replace `[YOUR-PASSWORD]`** with the database password you created in Step 1.
   *(Tip: If your password has special characters like `@` or `#`, use URL encoding or pick an alphanumeric password like `Clinic2026Secure` to avoid syntax issues).*

---

## 🗄️ Step 3: Run Database Schema & Create Tables (One-Click)

You can initialize all tables and the Super Admin account in 30 seconds using the Supabase SQL Editor:

1. In the Supabase left navigation bar, click **SQL Editor** (the `>_` terminal icon).
2. Click **New query** (or the **+** button).
3. Open `backend/src/database/schema.sql` from this repository, copy everything, and paste it into the editor.
4. Click the green **Run** button.
5. All 10 tables (`users`, `doctors`, `patients`, `appointments`, `visits`, `prescriptions`, `bills`, `clinic_settings`) will be created instantly, along with the default Super Admin account:
   - **Admin Email**: `admin@clinic.com`
   - **Admin Password**: `Admin@123`

*(Optional: To also populate demo patients, doctors, appointments, and bills, run `npm run migrate` from your local terminal with your Supabase `DATABASE_URL`).*

---

## 🔗 Step 4: Connect to Your Application

### A. Testing Locally
In your `backend/.env` file, set:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
Start the backend:
```powershell
cd backend
npm start
```
The server will output: `Connected to PostgreSQL database`.

---

### B. Connecting on Vercel
1. Go to your project on **[vercel.com](https://vercel.com)**.
2. Navigate to **Settings** &rarr; **Environment Variables**.
3. Add the following environment variables:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase connection string (URI) |
   | `JWT_SECRET` | `clinic_super_secret_jwt_key_2026_secured!` |
   | `NODE_ENV` | `production` |
4. Click **Save** and trigger a **Redeploy** from the Deployments tab.

Your full-stack clinic management system is now connected to Supabase Cloud PostgreSQL!
