# SOURCE-NEWS: 7-STAGE DEVELOPMENT MILESTONES

## MILESTONE 1: PROJECT SCAFFOLDING & FOUNDATION (Week 1)

### Objectives
- Initialize Next.js 15 project with TypeScript
- Set up Supabase project and database
- Configure development environment
- Establish core architecture

### Deliverables
- [ ] Next.js 15 project initialized with App Router
- [ ] TypeScript strict mode configured
- [ ] TailwindCSS + ShadCN/UI installed
- [ ] Supabase project created with pgvector extension
- [ ] Environment variables configured (.env.local)
- [ ] Database schema deployed (all tables created)
- [ ] Git repository initialized
- [ ] Basic project structure established

### Key Tasks
1. Run `npx create-next-app@latest source-news --typescript --tailwind --app`
2. Install dependencies: Supabase, ShadCN/UI, AI SDKs
3. Create Supabase project and enable pgvector
4. Execute database schema SQL
5. Set up folder structure: `/lib`, `/components`, `/app`
6. Configure environment variables for all services

### Success Criteria
- Project runs locally on `localhost:3000`
- Database connection successful
- All dependencies installed without errors
- TypeScript compilation passes

---

## MILESTONE 2: BACKEND INFRASTRUCTURE (Week 2)

### Objectives
- Build core backend services
- Implement AI orchestration layer
- Set up caching and Redis
- Create database client utilities

### Deliverables
- [ ] Supabase client library (`lib/supabase/client.ts`)
- [ ] Redis/KV client with caching functions
- [ ] Multi-AI orchestrator with fallback chain
- [ ] Database helper functions
- [ ] Error handling middleware
- [ ] API route structure established

### Key Tasks
1. Create Supabase client (browser + server)
2. Implement Redis caching layer (get/set/fingerprint)
3. Build AI orchestrator supporting Gemini, OpenAI, Groq, Grok
4. Add health monitoring for AI providers
5. Create database query helpers
6. Set up API route handlers structure

### Success Criteria
- Supabase queries execute successfully
- Redis caching works (set/get operations)
- AI orchestrator successfully calls Gemini API
- Fallback mechanism tested (disable primary, use secondary)
- Error boundaries catch and log failures

---

## MILESTONE 3: DATA INGESTION PIPELINE (Week 3-4)

### Objectives
- Build RSS feed ingestion system
- Implement content normalization
- Create fingerprinting for duplicate detection
- Set up automated workflows

### Deliverables
- [ ] RSS parser worker (`lib/workers/rss-ingest.ts`)
- [ ] Content normalization functions
- [ ] Fingerprinting system (SHA-256 hashing)
- [ ] API route: `/api/worker/ingest`
- [ ] n8n workflows configured (or Vercel cron)
- [ ] Government API integration
- [ ] Twitter/X signal detection (optional)

### Key Tasks
1. Create RSS feed parser for Nigerian sources
2. Implement URL canonicalization
3. Build fingerprint generation and checking
4. Create ingestion API endpoint
5. Set up Vercel cron job (every 5 minutes)
6. Add error handling for failed feeds
7. Test with 10+ Nigerian news sources

### Success Criteria
- Successfully ingest 100+ articles daily
- Duplicate detection prevents re-ingestion
- Fingerprints cached in Redis (7-day TTL)
- Cron job runs automatically every 5 minutes
- Error rate <5% for feed fetching

---

## MILESTONE 4: AI PROCESSING & CLUSTERING (Week 5-6)

### Objectives
- Implement embedding generation
- Build story clustering algorithm
- Create bias detection system
- Add sentiment analysis

### Deliverables
- [ ] Embedding generator (`lib/embeddings/generator.ts`)
- [ ] Clustering engine (`lib/clustering/engine.ts`)
- [ ] pgvector similarity search function
- [ ] Bias detection AI prompts
- [ ] Sentiment analysis module
- [ ] Source credibility scoring
- [ ] Automated cluster assignment

### Key Tasks
1. Generate embeddings using OpenAI text-embedding-3-small
2. Store embeddings in pgvector
3. Create similarity search SQL function
4. Build clustering algorithm (threshold: 0.75)
5. Implement bias classification (5-point spectrum)
6. Add sentiment scoring
7. Create worker for processing unclustered stories

### Success Criteria
- 85%+ clustering accuracy (same stories grouped)
- Embeddings generated in <2 seconds per article
- Similarity search returns relevant results
- Bias detection accuracy >80%
- Automated clustering runs every 10 minutes

---

## MILESTONE 5: FRONTEND & USER INTERFACE (Week 7-8)

### Objectives
- Build responsive web interface
- Create story feed and detail pages
- Implement user authentication
- Add bookmark and personalization features

### Deliverables
- [ ] Home page with story feed (`app/page.tsx`)
- [ ] Story cluster detail page (`app/story/[id]/page.tsx`)
- [ ] Story card component
- [ ] Bias visualization components
- [ ] Search functionality
- [ ] User authentication (Supabase Auth)
- [ ] User dashboard
- [ ] Bookmark system
- [ ] Dark/light theme toggle

### Key Tasks
1. Create home page with latest clusters
2. Build story detail page with viewpoint columns
3. Design story card component
4. Add bias indicators (color-coded)
5. Implement search with filters
6. Set up Supabase Auth (email + OAuth)
7. Create user dashboard
8. Add bookmark functionality
9. Implement theme switcher

### Success Criteria
- Page load time <2 seconds on 3G
- Mobile responsive (375px+)
- Lighthouse score >90
- Authentication works (email + Google)
- Bookmarks persist across sessions
- Dark mode fully functional

---

## MILESTONE 6: AI FEATURES & SUBSCRIPTION TIERS (Week 9-10)

### Objectives
- Implement AI explanation feature
- Build subscription tier system
- Add usage tracking and limits
- Create payment integration

### Deliverables
- [ ] AI explanation API (`app/api/story/[id]/explain/route.ts`)
- [ ] Floating AI button component
- [ ] Subscription tier enforcement
- [ ] Usage tracking system
- [ ] Rate limiting per tier
- [ ] Payment processing (Paystack)
- [ ] Admin dashboard for moderation

### Key Tasks
1. Create AI explanation endpoint
2. Build floating AI button UI
3. Implement tier-based feature access
4. Add usage tracking (daily limits)
5. Create rate limiting middleware
6. Integrate payment processor
7. Build admin panel for content moderation
8. Add source management interface

### Success Criteria
- AI explanations generate in <3 seconds
- Cache hit rate >60% for explanations
- Tier limits enforced correctly
- Payment flow works end-to-end
- Admin can moderate content
- Usage stats tracked accurately

---

## MILESTONE 7: TESTING, OPTIMIZATION & DEPLOYMENT (Week 11-12)

### Objectives
- Comprehensive testing
- Performance optimization
- Security hardening
- Production deployment

### Deliverables
- [ ] Unit tests for critical functions
- [ ] Integration tests for API routes
- [ ] Performance optimization (caching, lazy loading)
- [ ] Security audit completed
- [ ] RLS policies tested
- [ ] Production environment configured
- [ ] Vercel deployment
- [ ] Monitoring and analytics set up
- [ ] Documentation completed

### Key Tasks
1. Write tests for ingestion, clustering, AI features
2. Optimize database queries (add indexes)
3. Implement aggressive caching strategy
4. Audit RLS policies and API security
5. Test rate limiting and tier enforcement
6. Configure production environment variables
7. Deploy to Vercel
8. Set up error monitoring (Sentry)
9. Configure analytics (Vercel Analytics)
10. Load testing (100+ concurrent users)

### Success Criteria
- Test coverage >70% for critical paths
- All security vulnerabilities addressed
- Page load <2s, API response <500ms
- 99.5% uptime target
- Error rate <1%
- Successfully handles 10,000+ articles/day
- Monitoring dashboards operational
- Production deployment successful

---

## MILESTONE 8: IN-APP SOURCE BROWSER (Future Enhancement)

### Objectives
- Implement in-app browser for viewing source articles
- Keep users within the platform while browsing external sources
- Provide seamless navigation experience

### Deliverables
- [ ] In-app browser component with iframe/webview
- [ ] Source page viewer with simulated device/browser
- [ ] Navigation controls (back, forward, refresh)
- [ ] Security measures for external content
- [ ] Mobile-responsive browser view

### Key Tasks
1. Create browser component for viewing external URLs
2. Implement iframe with security headers
3. Add browser controls and navigation
4. Handle CORS and CSP issues
5. Add loading states and error handling
6. Test with various news source websites

### Success Criteria
- External sources load within the app
- Users can navigate source pages without leaving platform
- Security measures prevent malicious content
- Mobile and desktop views work correctly

---

## POST-LAUNCH: CONTINUOUS IMPROVEMENT

### Ongoing Tasks
- Monitor performance metrics
- Tune clustering thresholds
- Add new news sources
- Improve AI accuracy
- Gather user feedback
- Iterate on features
- Scale infrastructure as needed

### Key Metrics to Track
- Daily Active Users (DAU)
- Story ingestion rate
- Clustering accuracy
- AI explanation usage
- Cache hit rate
- Error rates
- Page load times
- Conversion rate (Free → Premium)

---

## TIMELINE SUMMARY

| Milestone | Duration | Cumulative Time |
|-----------|----------|-----------------|
| 1. Scaffolding | 1 week | Week 1 |
| 2. Backend Infrastructure | 1 week | Week 2 |
| 3. Data Ingestion | 2 weeks | Week 3-4 |
| 4. AI Processing | 2 weeks | Week 5-6 |
| 5. Frontend | 2 weeks | Week 7-8 |
| 6. AI Features & Tiers | 2 weeks | Week 9-10 |
| 7. Testing & Deployment | 2 weeks | Week 11-12 |

**Total Development Time: 12 weeks (3 months)**

---

## RISK MITIGATION

### Technical Risks
- **AI Provider Downtime**: Multi-provider fallback chain
- **Database Performance**: pgvector indexing, aggressive caching
- **RSS Feed Failures**: Error handling, retry logic
- **Clustering Accuracy**: Tunable thresholds, manual override

### Business Risks
- **Content Licensing**: Use only RSS feeds with proper terms
- **Regulatory Compliance**: Implement data protection measures
- **Scalability**: Design for horizontal scaling from day 1

---

## DEPENDENCIES & PREREQUISITES

### External Services Required
- Supabase account (free tier for development)
- Vercel account (free tier for development)
- Google Gemini API key
- OpenAI API key (optional for fallback)
- Domain name (for production)

### Team Requirements
- 1-2 Full-stack developers
- Access to Nigerian news sources
- Testing devices (mobile + desktop)

---

**Ready to begin? Start with Milestone 1!**
