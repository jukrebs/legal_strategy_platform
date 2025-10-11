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

### CourtListener Dataset (Optional)

1. **Activate the hackathon Conda environment**
   ```bash
   conda activate hackathon
   ```

2. **Export your CourtListener API token**
   ```bash
   export COURTLISTENER_API_TOKEN=your_token_here
   ```

3. **Generate a dataset for specific case types and attorney names**
   ```bash
   python backend/datasets/courtlistener_dataset.py \
     --case-types Civil \
     --lawyers "Jane Doe","John Smith" \
     --output data/courtlistener_cases.csv
   ```

   The script supports comma-separated values, optional `--max-records` limits, and the `--include-attorney-details` flag to fetch expanded attorney metadata.

### Weaviate Case Embeddings

Use the `backend/weaviate_cases.py` utility to create a Weaviate collection, ingest a court-case JSON dataset, and run similarity searches.

1. **Configure credentials and settings**
   - Edit `.env` with your Weaviate (and optional OpenAI) keys, then load it: `source .env`.
   - Update `config.yaml` with your desired operations (`operations:` list), dataset location, schema fields, and query parameters.

2. **Run the workflow**
   ```bash
   python backend/weaviate_cases.py --config config.yaml
   ```
   The script executes the operations listed in `config.yaml` (default: `create-collection`, `ingest`). Switch the list or set `operation: search` to run only a search.

3. **Override the operation on demand**
   ```bash
   python backend/weaviate_cases.py --config config.yaml --operation search
   ```
   This ignores the config’s `operations` list and performs just the specified step. The `search` section of `config.yaml` supports using the text of an existing case via `case_json`.

### Running the Frontend

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
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
