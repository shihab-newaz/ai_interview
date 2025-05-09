# AI Interview Platform

An intelligent web application that helps users prepare for technical and behavioral interviews through AI-powered voice conversations, question generation, and personalized feedback.

![AI Interview Platform](./public/robot.png)

## 🚀 Features

- **AI-Powered Voice Interviews**: Practice interviews with a conversational AI interviewer
- **Custom Interview Generation**: Create personalized interviews based on job role, experience level, and tech stack
- **Real-time Voice Interaction**: Natural speech-based conversations with the AI interviewer
- **Detailed Performance Feedback**: Get comprehensive feedback on your interview performance
- **Tech Stack Visualization**: Visual display of technologies required for positions
- **Secure Authentication**: Firebase-based authentication system
- **Interview History**: Access and review your past interview sessions

## 🔧 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React** - UI component library
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible UI components
- **Zod** - Form validation
- **React Hook Form** - Form state management

### Backend & Services
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - Database
- **Serverless Functions** - Next.js API routes

### AI & Voice
- **VAPI** - Voice AI integration platform
- **Google AI (Gemini)** - Question generation and feedback
- **OpenAI** - Conversational AI model
- **Deepgram** - Speech transcription
- **11labs** - Voice synthesis

## 🔄 Application Flow

1. **Authentication**
   - Users sign up or log in using email/password
   - Firebase handles authentication and session management

2. **Home Dashboard**
   - View past interviews and available interview templates
   - Start a new interview or continue previous sessions

3. **Interview Generation**
   - Conversational AI helps users define interview parameters:
     - Job role (Frontend, Backend, Full Stack, etc.)
     - Experience level (Entry, Mid, Senior)
     - Interview type (Technical, Behavioral, Mixed)
     - Tech stack (React, Node.js, etc.)
     - Number of questions

4. **Interview Practice**
   - AI-driven voice interviewer asks questions
   - Real-time speech transcription and processing
   - Natural conversation flow with the AI interviewer

5. **Feedback & Results**
   - Comprehensive feedback on performance
   - Scoring across multiple dimensions:
     - Communication Skills
     - Technical Knowledge
     - Problem Solving
     - Cultural Fit
     - Confidence and Clarity
   - Strengths and areas for improvement
   - Final assessment and recommendations

## 📁 Project Structure

```
├── app/                  # Next.js app router pages
│   ├── (auth)/           # Authentication routes
│   ├── (root)/           # Main application routes
│   ├── api/              # API endpoints
├── components/           # React components
│   ├── ui/               # UI components
│   ├── common/           # Shared components
├── lib/                  # Utility functions
│   ├── actions/          # Server actions
│   ├── services/         # Service integrations
├── firebase/             # Firebase configuration
├── hooks/                # Custom React hooks
├── schemas/              # Zod validation schemas
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account
- VAPI account
- Google AI API access
- 11labs account

### Environment Variables
Create a `.env.local` file with the following:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# VAPI
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=

# Google AI
GOOGLE_API_KEY=
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/interview-platform.git
   cd interview-platform
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 License

[MIT](LICENSE)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [VAPI](https://vapi.ai/)
- [Google AI](https://ai.google.dev/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)s