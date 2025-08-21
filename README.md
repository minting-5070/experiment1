# Research Assistant - Academic AI Assistant

A sophisticated AI assistant specialized in academic research, leveraging top-tier journals and high-impact papers to provide credible, peer-reviewed information.

## 🔬 Features

- **Academic Excellence**: Prioritizes top-tier journals (Nature, Science, Cell, UTD 24, etc.)
- **High-Impact Sources**: Focuses on papers with high impact factors (IF > 3.0)
- **Peer-Reviewed Only**: Exclusively cites peer-reviewed publications
- **Credibility First**: Advanced filtering for reliable academic sources
- **Journal Rankings**: Built-in journal ranking and impact factor information
- **GPT-4o Powered**: Utilizes the latest OpenAI GPT-4o model

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the project root:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

**Get your API key from**: [OpenAI Platform](https://platform.openai.com/api-keys)

### 2. Installation & Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📚 Academic Sources

### Top Science Journals
- **Nature** (IF: 69.5) - World's premier science journal
- **Science** (IF: 63.8) - AAAS flagship publication
- **Cell** (IF: 66.9) - Leading cell biology journal
- **NEJM** (IF: 158.5) - Top medical journal
- **The Lancet** (IF: 202.7) - Premier medical publication

### Business & Management (UTD 24)
- **Academy of Management Journal** - Top management journal
- **Strategic Management Journal** - Strategy research leader
- **Management Science** - Analytics and operations
- **Journal of Marketing** - Marketing research authority
- **American Economic Review** - Premier economics journal

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Model**: OpenAI GPT-4o
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Markdown**: React Markdown with GFM support
- **TypeScript**: Full type safety

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Research Assistant"
   git branch -M main
   git remote add origin https://github.com/yourusername/research-assistant.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `OPENAI_API_KEY`
   - Deploy!

### Environment Variables for Production

In Vercel dashboard, add:
- `OPENAI_API_KEY`: Your OpenAI API key

## 📖 Usage

Simply ask any research question or request academic analysis:

- "What are the latest developments in AI creativity?"
- "Analyze the impact of ESG on corporate performance"
- "Review literature on quantum computing applications"
- "Find recent papers on sustainable supply chain management"

The assistant will automatically:
- Search top-tier academic sources
- Prioritize high-impact publications
- Provide credible citations
- Format responses with proper academic structure

## 🔍 Quality Standards

- **Impact Factor Priority**: Prefers journals with IF > 3.0
- **Citation Requirements**: Substantial citation counts required
- **Recency Preference**: Prioritizes papers from last 10 years
- **Peer Review Verification**: Only peer-reviewed publications
- **Predatory Journal Exclusion**: Filters out questionable venues

## 📄 License

MIT License - feel free to use for academic and research purposes.

## 🤝 Contributing

Contributions welcome! Please feel free to submit pull requests or open issues for improvements.