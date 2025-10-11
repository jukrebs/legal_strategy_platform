# Legal Strategy Platform

A comprehensive AI-powered legal strategy platform built with Next.js that helps legal professionals analyze cases, discover similar precedents, develop litigation strategies, and simulate courtroom scenarios.

## 🌟 Features

### 1. **Case Intake** (`/intake`)
- Structured case information collection
- Jurisdiction and judge selection
- Case type and posture classification
- Opposing counsel information
- Detailed fact gathering
- Preference settings for risk tolerance, brief style, and settlement posture

### 2. **Similar Cases Discovery** (`/cases`)
- AI-powered case law search based on your facts
- Find relevant precedents and case law
- View confidence scores and similarity metrics
- Pin helpful cases for reference
- Filter by outcome, jurisdiction, and relevance
- Access full opinions and citations

### 3. **Strategy Synthesis** (`/strategy`)
- Generate data-driven litigation strategies
- Compare multiple strategic approaches
- Review pros, cons, and required elements
- Assess risk flags and complexity levels
- Review supporting case law for each strategy
- Confidence scoring for recommended strategies

### 4. **Digital Twins** (`/twins`)
- Judge behavioral analysis and profiling
- Opposing counsel tactical assessment
- Pattern recognition from historical data
- Predicted tendencies and preferences
- Evidence-based insights

### 5. **Courtroom Simulation** (`/simulation`)
- Interactive argument testing
- Simulated judge responses
- Opposition counter-arguments
- Real-time scoring and feedback
- Feature attribution analysis
- Multi-round argument refinement

### 6. **Export Reports** (`/export`)
- Comprehensive case reports
- Strategy recommendations with citations
- Risk analysis documentation
- Key precedents compilation
- Professional formatting for client delivery

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legal_strategy_platform
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   
   Due to peer dependency conflicts, use the legacy peer deps flag:
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the frontend directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/legal_strategy"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

5. **Set up the database** (if using database features)
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database with sample data
   npm run seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The server will start at [http://localhost:3000](http://localhost:3000)

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Usage Guide

### Typical Workflow

1. **Start with Case Intake**
   - Navigate to `/intake` (default landing page)
   - Fill in all case details including jurisdiction, judge, case type, and facts
   - Set your preferences for risk tolerance and brief style
   - Submit to proceed to the next step

2. **Review Similar Cases**
   - Automatically navigates to `/cases` after intake
   - Review AI-generated similar cases
   - Pin cases that are particularly relevant
   - Mark cases as helpful or not helpful
   - Access full opinions via provided links

3. **Develop Your Strategy**
   - Go to `/strategy` to see recommended litigation strategies
   - Compare different strategic approaches
   - Review pros, cons, and supporting case law
   - Note risk flags and complexity assessments

4. **Understand Key Players**
   - Visit `/twins` to see judge and opposing counsel profiles
   - Review behavioral patterns and tendencies
   - Understand judicial preferences
   - Anticipate opposing counsel tactics

5. **Test Your Arguments**
   - Navigate to `/simulation` for courtroom simulation
   - Enter your legal arguments
   - Receive simulated opposition responses
   - Get judge feedback with scoring
   - Iterate and refine your arguments

6. **Export Your Work**
   - Go to `/export` to generate a comprehensive report
   - Download formatted documentation
   - Share with clients or colleagues

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Forms**: React Hook Form + Zod
- **State Management**: React Hooks

## 📁 Project Structure

```
nextjs_space/
├── app/                          # Next.js app directory
│   ├── (dashboard)/             # Dashboard layout group
│   │   ├── intake/              # Case intake page
│   │   ├── cases/               # Similar cases discovery
│   │   ├── strategy/            # Strategy synthesis
│   │   ├── twins/               # Digital twins (Judge/Counsel)
│   │   ├── simulation/          # Courtroom simulation
│   │   └── export/              # Export reports
│   ├── api/                     # API routes
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Root page (redirects to /intake)
├── components/                   # Reusable React components
│   ├── layout/                  # Layout components
│   └── ui/                      # UI component library
├── lib/                         # Utility functions and types
│   ├── types.ts                 # TypeScript type definitions
│   ├── utils.ts                 # Helper functions
│   ├── db.ts                    # Database utilities
│   └── mock-data.ts             # Sample data
├── prisma/                      # Database schema and migrations
│   └── schema.prisma            # Prisma schema definition
└── public/                      # Static assets
```

## 🎨 Component Library

This project uses **shadcn/ui** components built on top of Radix UI primitives. Key components include:

- Forms and inputs (Input, Textarea, Select, Checkbox, etc.)
- Data display (Card, Table, Badge, etc.)
- Feedback (Alert, Toast, Dialog, etc.)
- Navigation (Tabs, Accordion, etc.)

To add new components:
```bash
npx shadcn-ui@latest add [component-name]
```

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Database operations
npx prisma studio          # Open Prisma Studio (DB GUI)
npx prisma migrate dev     # Create and apply migrations
npx prisma generate        # Regenerate Prisma Client
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **Cases**: Stores case information and metadata
- **Judges**: Judge profiles and behavioral data
- **Strategies**: Generated litigation strategies
- **Simulations**: Courtroom simulation results

View and edit the schema in `prisma/schema.prisma`.

## 🎯 Key Features Explained

### Confidence Scoring
The platform provides confidence scores (0-100) for:
- Case similarity matches
- Strategy recommendations
- Argument strength in simulations

### Risk Analysis
Three risk tolerance levels:
- **Conservative**: Minimize risk, traditional approaches
- **Moderate**: Balanced risk/reward
- **Aggressive**: Novel arguments, higher risk strategies

### Judge Profiling
Analyzes judges across multiple dimensions:
- Pleading strictness (procedural compliance)
- Precedent weight (reliance on case law)
- Policy receptivity (willingness to consider policy arguments)
- Plaintiff/defendant friendliness

## 🔐 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: AI/ML API keys (if integrated)
# OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="..."
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software developed for legal strategy analysis.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify DATABASE_URL in .env is correct
# Ensure database exists
psql -U postgres -c "CREATE DATABASE legal_strategy;"
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## 📞 Support

For questions or issues:
1. Check existing documentation
2. Review the codebase comments
3. Open an issue in the repository
4. Contact the development team

## 🗺️ Roadmap

Future enhancements may include:
- [ ] Real-time collaboration features
- [ ] Advanced AI integration for argument generation
- [ ] Mobile application
- [ ] Integration with legal research databases
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Document automation

---

**Built with ❤️ for legal professionals**
