# Team-28
# Milestone Tracker

A full-stack platform for tracking children's developmental milestones, designed for parents and volunteers. Features include milestone submission with media evidence, expert review, file uploads to Cloudinary, multilingual support, and a modern React UI.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [File Upload Guide](#file-upload-guide)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Botpress Chatbot Integration](#botpress-chatbot-integration)
- [Demo Accounts](#demo-accounts)
- [Contributing](#contributing)
- [License](#license)

---

## Project Structure

```
Team-28/
│
├── backend/
│   ├── config/           # Cloudinary and DB configs
│   ├── data/             # JSON data files (if not using MongoDB)
│   ├── routes/           # Express route handlers
│   ├── index.js          # Main Express server
│   └── package.json
│
├── frontend/
│   ├── public/           # Static assets (logo, audio guides)
│   ├── src/              # React source code
│   │   ├── locales/      # i18n translation files
│   │   ├── App.jsx       # Main app component
│   │   ├── Home.jsx      # Landing page
│   │   ├── Login.jsx     # Login page
│   │   ├── Register.jsx  # Registration page
│   │   ├── ParentDashboard.jsx
│   │   ├── VolunteerDashboard.jsx
│   │   ├── MilestoneTracker.jsx
│   │   ├── MilestoneDisplay.jsx
│   │   └── ...           # Other components
│   ├── index.html        # Main HTML entry
│   └── package.json
│
├── FILE_UPLOAD_GUIDE.md  # Detailed file upload documentation
├── README.md             # This file
└── .gitignore
```

---

## Features

- **User Roles:** Parent and Volunteer accounts
- **Milestone Tracking:** Submit and review milestones by age group and category
- **Media Evidence:** Upload images/videos or provide media URLs as evidence
- **Cloudinary Integration:** Secure file storage and optimization
- **Expert Review:** Volunteers review and provide feedback on submissions
- **SMS Notifications:** Parents notified on important updates (rejection, feedback)
- **Multilingual Support:** English and Hindi (i18n)
- **Modern UI:** Responsive React frontend with Tailwind CSS
- **Botpress Chatbot:** Integrated support chatbot in the bottom-right corner

---

## Tech Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, i18next
- **Backend:** Node.js, Express, Multer, Cloudinary, (optionally MongoDB via Mongoose)
- **Database:** JSON files (default) or MongoDB (recommended for production)
- **File Storage:** Cloudinary
- **Chatbot:** Botpress Webchat

---

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Cloudinary and MongoDB credentials (see [Environment Variables](#environment-variables)).

3. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server runs on [http://localhost:3000](http://localhost:3000).

---

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend dev server:**
   ```bash
   npm run dev
   ```
   The app runs on [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

Create a `.env` file in the `backend/` directory with the following:

```properties
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/milestone-tracker
```

---

## File Upload Guide

See [`FILE_UPLOAD_GUIDE.md`](FILE_UPLOAD_GUIDE.md) for:
- Supported file types and size limits
- Cloudinary setup
- API endpoints for file and URL submissions
- Security and validation details
- Usage examples for both frontend and backend

---

## Database Schema

### User

```json
{
  "id": "string",
  "name": "string",
  "contact": "string",
  "username": "string",
  "password": "string (hashed)",
  "role": "parent|volunteer"
}
```

### Child

```json
{
  "_id": "string",
  "name": "string",
  "age": "number",
  "ageGroup": "string",
  "parentId": "string"
}
```

### Milestone

```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "ageGroup": "string",
  "category": "string"
}
```

### Milestone Status

```json
{
  "_id": "string",
  "childId": "string",
  "milestoneId": "string",
  "status": "pending|accepted|rejected",
  "mediaUrl": "string",
  "mediaType": "image|video",
  "mediaSize": "number",
  "mediaDuration": "number",
  "fileName": "string",
  "fileType": "string",
  "submittedAt": "ISO string",
  "reviewedAt": "ISO string",
  "reviewedBy": "string",
  "rejectionReason": "string",
  "feedback": "string"
}
```

---

## API Endpoints

See [`FILE_UPLOAD_GUIDE.md`](FILE_UPLOAD_GUIDE.md) for full details.

**Auth**
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login

**Milestones**
- `GET /api/milestones/milestones` — List all milestones
- `GET /api/milestones/children/:parentId` — List children for a parent

**Parent Actions**
- `POST /api/parents/milestone/submit-with-file` — Submit milestone with file upload
- `POST /api/parents/milestone/submit` — Submit milestone with media URL

**Volunteer Actions**
- `GET /api/volunteers/dashboard` — Get submissions for review
- `POST /api/volunteers/review/:submissionId` — Review a submission

---

## Botpress Chatbot Integration

The Botpress chatbot is integrated and appears in the bottom-right corner of the app.  
Scripts are included in [`frontend/index.html`](frontend/index.html):

```html
<script src="https://cdn.botpress.cloud/webchat/v3.0/inject.js"></script>
<script src="https://files.bpcontent.cloud/2025/06/07/22/20250607222825-16SKALZW.js"></script>
```

**Note:**  
The chatbot config script is ignored in git via `frontend/.gitignore` to keep credentials private.

---

## Demo Accounts

- **Parent:**  
  - Username: `parent1`  
  - Password: `parent123`

- **Volunteer:**  
  - Username: `volunteer1`  
  - Password: `volunteer123`

---

## Contributing

1. Fork this repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork and open a Pull Request

##Deployments
1. frontend has been deployed on vercel.
2. backend has been deployed on render here- https://milestone-tracker-jrst.onrender.com

---

## License

This project is licensed under the MIT License.

---
