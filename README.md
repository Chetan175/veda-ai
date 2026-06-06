# VedaAI - AI Assessment Creator

An intelligent assessment generation system that helps teachers create high-quality question papers using AI. Teachers can upload source materials, specify assessment requirements, and generate professionally formatted question papers with multiple difficulty levels and question types.

## 🚀 Features

### Core Functionality
- **Assignment Creation**: Create assignments with customizable question types, marks, and due dates
- **AI-Powered Generation**: Uses OpenAI (or local fallback) to generate contextually relevant questions
- **Multiple Question Types**:
  - Multiple Choice Questions (MCQ)
  - Short Answer Questions
  - Diagram/Graph-Based Questions
  - Numerical Problems

- **PDF Export**: Download professionally formatted question papers as PDF
- **Real-time Updates**: WebSocket integration for live progress tracking
- **File Upload**: Support for PDF and text documents as source material
- **Response Parsing**: Automatic parsing of AI responses into structured formats

### Technical Highlights
- **Type-Safe**: Full TypeScript implementation across frontend and backend
- **Scalable Architecture**: Job queue system with BullMQ for reliable processing
- **Fallback Systems**: Works with or without external services (MongoDB, Redis, OpenAI)
- **Real-time Communication**: Socket.io for live updates
- **Responsive Design**: Mobile-friendly UI with modern styling
- **JWT Authentication**: Secure user authentication and session management

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker** (optional, for containerized deployment)

### Optional External Services
- **MongoDB**: For production data persistence (uses in-memory storage in demo mode)
- **Redis**: For job queuing (falls back to local processing)
- **OpenAI API Key**: For advanced question generation (uses local generator if unavailable)

## 🛠️ Installation & Setup

### 1. Quick Start with Docker (Recommended)

```bash
# Clone or extract the project
cd veda-ai

# Copy environment variables
cp .env.example .env

# Edit .env and add your OpenAI API key (optional)
# OPENAI_API_KEY=sk-...

# Start all services
docker-compose up --build

# Application will be available at:
# - Frontend: http://localhost:3000
# - API: http://localhost:4000
```

### 2. Local Development Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file
# Edit: OPENAI_API_KEY, JWT_SECRET, etc.

# Start MongoDB locally (if using Docker)
# Or update MONGODB_URI to use local/remote instance

# Start Redis locally (if using Docker)
# Or update REDIS_URL to use local/remote instance

# In one terminal, start the API
npm run dev:api

# In another terminal, start the web app
npm run dev:web

# Application will be available at:
# - Frontend: http://localhost:3000
# - API: http://localhost:4000
```

### 3. Demo Mode (No External Dependencies)

```bash
# Set demo mode in .env
DEMO_MODE=true

# This will:
# - Use in-memory storage instead of MongoDB
# - Process jobs locally instead of using Redis queue
# - Use local question generation instead of OpenAI

npm install
npm run dev:api
npm run dev:web
```

## 🔑 Environment Variables

```env
# API Configuration
API_PORT=4000
CLIENT_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/veda_ai

# Cache & Queue
REDIS_URL=redis://127.0.0.1:6379

# AI Generation (optional)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Mode
DEMO_MODE=false  # Set to true for demo without external services
```

## 📁 Project Structure

```
veda-ai/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts       # Main server entry
│   │   ├── config.ts      # Configuration
│   │   ├── runtime.ts     # Job queue & runtime
│   │   ├── middleware/    # Auth, logging, etc.
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   └── storage/       # Database/cache adapters
│   └── tsconfig.json
│
├── web/                    # Next.js frontend
│   ├── app/               # Pages and layouts
│   ├── components/        # React components
│   ├── lib/               # Utilities, API client, state
│   └── tsconfig.json
│
├── shared/                # Shared types & utilities
│   ├── assignment.ts      # Data schemas
│   ├── user.ts            # User types
│   ├── profile.ts         # App config
│   └── paper-builder.ts   # Question generation logic
│
├── scripts/               # Utility scripts
├── docker-compose.yml     # Local dev environment
├── Dockerfile             # API container
├── Dockerfile.web         # Web app container
└── package.json           # Dependencies
```

## 🔐 Authentication

The system uses JWT-based authentication. Users must register/login before accessing the assignment creation feature.

### API Authentication Flow

1. **Register**: `POST /api/auth/register`
   ```json
   {
     "email": "teacher@school.com",
     "name": "Teacher Name",
     "password": "securepassword",
     "schoolName": "School Name (optional)"
   }
   ```

2. **Login**: `POST /api/auth/login`
   ```json
   {
     "email": "teacher@school.com",
     "password": "securepassword"
   }
   ```

3. **Response**: Returns JWT token
   ```json
   {
     "token": "eyJhbGc...",
     "user": {
       "id": "uuid",
       "email": "teacher@school.com",
       "name": "Teacher Name"
     }
   }
   ```

4. **Use Token**: Include in all protected requests
   ```
   Authorization: Bearer eyJhbGc...
   ```

## 🚀 Usage

### Creating an Assignment

1. Navigate to "Create Assignment" in the web interface
2. Fill in assignment details:
   - Due date
   - Number of questions per type
   - Marks per question
   - Additional instructions
   - Optional: Upload source material (PDF or text)

3. Click "Generate" to queue the assessment
4. Monitor progress in real-time
5. View and download the generated question paper

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

#### Assignments
- `GET /api/assignments` - List all assignments
- `POST /api/assignments` - Create new assignment
- `GET /api/assignments/:id` - Get assignment details
- `POST /api/assignments/:id/regenerate` - Regenerate assessment
- `GET /api/assignments/:id/pdf` - Download PDF
- `GET /api/assignments/:id/paper` - Get generated paper JSON
- `DELETE /api/assignments/:id` - Delete assignment

#### Health
- `GET /api/health` - Check API health and service status

## 📊 Data Schemas

### Question Paper Structure

```json
{
  "title": "Physics Mid-Term Assessment",
  "schoolName": "Delhi Public School",
  "subject": "Physics",
  "className": "Class 10",
  "maximumMarks": 80,
  "timeAllowed": "3 hours",
  "instructions": ["Attempt all questions"],
  "sections": [
    {
      "id": "section_a",
      "title": "Section A",
      "subtitle": "Multiple Choice",
      "instruction": "Attempt all questions (1 mark each)",
      "questions": [
        {
          "id": "q1",
          "text": "Question text...",
          "difficulty": "easy",
          "marks": 1,
          "answer": "Answer key..."
        }
      ]
    }
  ]
}
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck:web
npm run typecheck:api

# Run specific server
npm run dev:web   # Frontend only
npm run dev:api   # Backend only
npm run dev       # Both (requires pm2)
```

## 📦 Deployment

### Docker Deployment

```bash
# Build images
docker build -t veda-ai-api:latest -f Dockerfile .
docker build -t veda-ai-web:latest -f Dockerfile.web .

# Push to registry
docker tag veda-ai-api:latest your-registry/veda-ai-api:latest
docker push your-registry/veda-ai-api:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d
```

### Environment for Production

```env
API_PORT=4000
CLIENT_ORIGIN=https://yourdomain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/veda_ai
REDIS_URL=redis://redis-host:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=generate-a-secure-random-string
DEMO_MODE=false
```

### Vercel Deployment (Frontend)

```bash
# Configure Vercel
vercel --prod

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-api.com
```

## 🛠️ Development

### Adding a New Question Type

1. Update `shared/assignment.ts` with new type
2. Modify `shared/paper-builder.ts` generation logic
3. Update UI in `web/components/AssignmentForm.tsx`
4. Update API validation in `server/src/routes/assignments.ts`

### Customizing PDF Output

Edit `server/src/services/pdf.ts` to modify PDF styling, layout, or content.

### Changing AI Provider

Modify `server/src/services/generation.ts` to use different LLM providers (Claude, Gemini, etc.).

## 📝 API Documentation

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Create Assignment
```bash
curl -X POST http://localhost:4000/api/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -F "payload=@payload.json" \
  -F "sourceFile=@document.pdf"
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running on `localhost:27017`
- Update `MONGODB_URI` in `.env` if using different host
- Or set `DEMO_MODE=true` to use in-memory storage

### Redis Connection Error
- Ensure Redis is running on `localhost:6379`
- Update `REDIS_URL` in `.env` if using different host
- Jobs will fall back to local processing if Redis unavailable

### OpenAI API Errors
- Verify your OpenAI API key is correct
- Check your API quota and billing
- System will use local question generation as fallback

### WebSocket Connection Issues
- Ensure API and frontend are on correct URLs
- Check `CLIENT_ORIGIN` matches your frontend URL
- Verify CORS settings in server config

### PDF Generation Issues
- Check `server/uploads/generated/` directory exists and is writable
- Ensure PDFKit is properly installed
- Verify sufficient disk space available

## 📚 Technologies

- **Frontend**: Next.js, React, TypeScript, Zustand, Socket.io Client
- **Backend**: Node.js, Express, TypeScript, BullMQ, Socket.io
- **Database**: MongoDB, Redis
- **AI**: OpenAI API (GPT-4o-mini)
- **PDF**: PDFKit
- **Authentication**: JWT, bcryptjs
- **Validation**: Zod
- **Styling**: CSS, Lucide Icons

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For issues, questions, or suggestions:
1. Check the troubleshooting section above
2. Review API documentation in this README
3. Inspect browser console and server logs for errors
4. Check health endpoint: `GET /api/health`

## 🎯 Future Roadmap

- [ ] User collaboration on assignments
- [ ] Question template library
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Assignment versioning and history
- [ ] Batch assignment creation
- [ ] Integration with Learning Management Systems (LMS)

---

**Made with ❤️ for educators**
