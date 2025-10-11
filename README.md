# Legal Strategy Platform

An AI-powered legal strategy platform that helps legal professionals analyze cases, discover similar precedents, develop litigation strategies, and simulate courtroom scenarios.

## 📁 Project Structure

```
legal_strategy_platform/
├── backend/          # Backend API (if applicable)
└── frontend/         # Next.js frontend application
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm package manager
- PostgreSQL database (optional, for full features)

### Running the Frontend

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   
   Due to peer dependency conflicts between TypeScript ESLint packages, use the `--legacy-peer-deps` flag:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables** (optional)
   
   Create a `.env` file in the `frontend/` directory if you need database features:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/legal_strategy"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at **http://localhost:3000**

5. **Build for production** (optional)
   ```bash
   npm run build
   npm run start
   ```

### Key Features

- **Case Intake**: Structured case information collection
- **Similar Cases Discovery**: AI-powered case law search
- **Strategy Synthesis**: Data-driven litigation strategies
- **Digital Twins**: Judge and opposing counsel profiling
- **Courtroom Simulation**: Interactive argument testing
- **Export Reports**: Comprehensive case documentation

## 📖 Documentation

For detailed documentation about the frontend features, components, and architecture, see the [Frontend README](./frontend/README.md).

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Radix UI primitives

## 🐛 Troubleshooting

### Installation Issues

If you encounter dependency conflicts during installation:
```bash
npm install --legacy-peer-deps
```

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
npm run dev -- -p 3001
```

Or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

Ensure PostgreSQL is running and the `DATABASE_URL` in your `.env` file is correct.

## 📝 License

This project is proprietary software developed for legal strategy analysis.

---

**Backend in /backend**  
**Frontend in /frontend**