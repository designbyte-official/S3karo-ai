# Drizzle Studio - Visual Database Browser

## 🎯 What is Drizzle Studio?

Drizzle Studio is a visual database browser (like Prisma Studio) that lets you:
- ✅ View all your database tables
- ✅ Browse and edit data
- ✅ See relationships
- ✅ Run queries visually
- ✅ Manage your database

## 🚀 How to Open Drizzle Studio

### Method 1: Using npm script (Easiest)

```bash
npm run db:studio
```

This will:
1. Start Drizzle Studio
2. Open in your browser automatically
3. **Default port: 4984** (http://localhost:4984)

### Method 2: Using drizzle-kit directly with custom port

```bash
npx drizzle-kit studio --port 4984
```

### Method 3: Use any available port

```bash
npx drizzle-kit studio --port 3001
# or
npx drizzle-kit studio --port 5000
# or any available port
```

## 🔧 Change Default Port

If port 4984 is also in use, edit `package.json`:

```json
"db:studio": "drizzle-kit studio --port YOUR_PORT"
```

Replace `YOUR_PORT` with any available port (e.g., 3001, 5000, 8080).

## 📊 What You'll See

Once Drizzle Studio opens, you'll see:

### 1. **Tables List**
- `users` - All user accounts
- `files` - All uploaded files

### 2. **Table View**
- Click on a table to see all records
- View columns and data
- Edit data directly
- Add new records
- Delete records

### 3. **Data Browser**
- Filter records
- Search data
- Sort columns
- Export data

## 🎨 Features

### View Data
- Click any table name to see all records
- Scroll through data
- See all columns

### Edit Data
- Click on any cell to edit
- Press Enter to save
- Changes are saved immediately

### Add Records
- Click "Add Row" button
- Fill in the fields
- Save the record

### Delete Records
- Click on a row
- Click delete button
- Confirm deletion

### Filter & Search
- Use the search bar
- Filter by column values
- Sort by any column

## 🔍 Example: Viewing Your Data

1. **Open Studio:**
   ```bash
   npm run db:studio
   ```

2. **Access in Browser:**
   - Open: http://localhost:4984
   - (Or whatever port you specified)

3. **View Users:**
   - Click on `users` table
   - See all registered users
   - View email, full_name, avatar, etc.

4. **View Files:**
   - Click on `files` table
   - See all uploaded files
   - View file names, types, sizes, etc.

5. **Edit Data:**
   - Click any cell
   - Edit the value
   - Press Enter to save

## 🛠️ Other Drizzle Commands

### Generate Migrations
```bash
npm run db:generate
```
Creates migration files based on schema changes.

### Push Schema Changes
```bash
npm run db:push
```
Pushes schema changes directly to database (development).

### Run Migrations
```bash
npm run db:migrate
```
Runs migration files (production).

## 📝 Your Schema Location

Your database schema is defined in:
```
lib/database/schema.ts
```

This file defines:
- Table structures
- Column types
- Relationships
- Constraints

## 🎯 Quick Tips

1. **Keep Studio Open** - Great for debugging
2. **Check Data** - Verify your app is saving correctly
3. **Test Queries** - See what data looks like
4. **Edit Safely** - Changes are immediate, be careful!

## 🆘 Troubleshooting

### Port Already in Use
If you get `EADDRINUSE` error:

**Option 1: Kill the process using the port**
```bash
# For port 4984
lsof -ti:4984 | xargs kill -9

# For any port
lsof -ti:YOUR_PORT | xargs kill -9
```

**Option 2: Use a different port**
```bash
npx drizzle-kit studio --port 3001
```

**Option 3: Find what's using the port**
```bash
lsof -i:4984
```

### Studio Won't Open
- Check if the port is available
- Make sure DATABASE_URL is set correctly
- Verify database connection

### Can't See Tables
- Run `npm run db:push` first
- Check if tables exist in database
- Verify schema file is correct

### Connection Error
- Check `.env.local` has DATABASE_URL
- Verify Neon database is not paused
- Test connection string

## 🎉 That's It!

Drizzle Studio is now running. Open your browser and start exploring your database!

**Default URL:** http://localhost:4984

If you changed the port, use that port number instead.
