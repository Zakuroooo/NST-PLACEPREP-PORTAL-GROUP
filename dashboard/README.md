# Dashboard

Product layer containing both user-facing applications — the student interview prep portal (Use Case 1) and the faculty curriculum intelligence dashboard (Use Case 2).

## Structure

```
dashboard/
├── student-portal/            # Use Case 1 — Next.js app for students
│   ├── app/
│   │   ├── page.tsx           # Home — company search
│   │   ├── company/[name]/    # Company detail page
│   │   └── topics/            # Browse by topic
│   ├── components/
│   │   ├── CompanyCard.tsx
│   │   ├── TopicBadge.tsx
│   │   ├── QuestionList.tsx
│   │   └── DifficultyChart.tsx
│   └── package.json
│
├── faculty-dashboard/         # Use Case 2 — Next.js app for faculty
│   ├── app/
│   │   ├── page.tsx           # Gap analysis overview
│   │   ├── courses/           # Course-level drill-down
│   │   └── heatmap/           # Industry vs syllabus heatmap
│   ├── components/
│   │   ├── GapHeatmap.tsx
│   │   ├── CoverageBar.tsx
│   │   └── SyllabusMapper.tsx
│   └── package.json
│
└── api/                       # Shared FastAPI backend
    ├── main.py
    ├── routers/
    │   ├── companies.py       # GET /companies, /companies/{name}/topics
    │   ├── questions.py       # GET /questions (filterable)
    │   ├── topics.py          # GET /topics
    │   └── syllabus.py        # GET /syllabus/gap-analysis
    └── requirements.txt
```

## Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | Next.js 14, Tailwind CSS |
| Charts | Recharts (student portal), Chart.js (faculty heatmaps) |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (faculty-only gating) |
| Deployment | Vercel (frontend), Supabase Edge (backend) |

## Use Case 1 — Student Portal

Key views:
- **Home** — search and filter companies by name, tier, role
- **Company Page** — topic breakdown, round types, difficulty distribution, sample questions
- **Topic Browser** — see which companies test a specific topic most frequently

## Use Case 2 — Faculty Dashboard

Key views:
- **Gap Analysis Overview** — topics industry tests vs what the syllabus covers
- **Heatmap** — course x company coverage matrix
- **Course Drill-down** — for each course, see aligned and missing industry topics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List all companies with metadata |
| GET | `/companies/{name}/topics` | Topic frequency breakdown for a company |
| GET | `/companies/{name}/questions` | Paginated question list |
| GET | `/topics` | All topics with industry frequency |
| GET | `/questions?company=&topic=&difficulty=` | Filtered questions |
| GET | `/syllabus/gap-analysis` | Industry vs syllabus gap report |

## Getting Started

```bash
# Backend API
cd dashboard/api
pip install -r requirements.txt
uvicorn main:app --reload

# Student portal
cd dashboard/student-portal
npm install && npm run dev

# Faculty dashboard
cd dashboard/faculty-dashboard
npm install && npm run dev
```

## Admin portal
cd dashboard/admin-portal
npm install && npm run dev

## Status

| Component | Status |
|-----------|--------|
| FastAPI backend | 🔲 Not started |
| Student portal | 🔲 Not started |
| Faculty dashboard | 🔲 Not started |
| Vercel deployment | 🔲 Not started |
