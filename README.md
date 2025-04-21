# Firehose

A simple document processing and storage system built with Firebase and Next.js.

## Features

- Upload PDF, HTML, and Markdown/Text documents
- Automatic text extraction and indexing
- Simple text search functionality
- Basic document viewer

## Technologies

- **Frontend**: Next.js with TypeScript and TailwindCSS
- **Backend**: Firebase Cloud Functions (TypeScript)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   cd functions && npm install && cd ..
   ```
3. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
4. Initialize your Firebase project:
   ```
   firebase login
   firebase init
   ```
5. Copy `.env.local.example` to `.env.local` and add your Firebase configuration values

### Development

Run the development server:

```bash
npm run dev
# In another terminal
npm run firebase:emulators
```

### Deployment

Deploy to Firebase:

```bash
npm run build
firebase deploy
```

## License

MIT