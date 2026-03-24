# RezeptManager

![Java](https://img.shields.io/badge/Java-17-blue)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3-green)
![React](https://img.shields.io/badge/React-Frontend-61dafb)
![Fullstack](https://img.shields.io/badge/Type-Fullstack-orange)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Portfolio Project](https://img.shields.io/badge/Purpose-Portfolio-lightgrey)

Fullstack recipe manager with OCR import, image upload and PDF export built using React and Spring Boot.

Clean architecture portfolio project focused on realistic CRUD workflows and structured data handling.

**Status:** Active development

<hr>

🚀 Screenshots

![Recipe List](docs/screenshots/list.png)
![Recipe Detail](docs/screenshots/detail.png)
![Scan Preview](docs/screenshots/scan.png)

<hr>

### 🧱 Architecture

```
Frontend (React)
   ↓ REST
Spring Boot API
   ↓
Service Layer
   ↓
JPA / H2 Database


+ OCR Service (Tesseract)
+ PDF Service (PDFBox)
+ Local Image Storage
```

Key ideas:

- layered backend structure
- reusable form logic in frontend
- DTO based API
- separated scan workflow

### ▶️ Run Locally
**Backend**
```
cd backend
mvn spring-boot:run
```

**Frontend**
```
cd frontend
npm install
npm run dev
```

<hr>

### 🎯 Learning Focus
- Fullstack CRUD architecture
- REST API design
- File upload handling
- OCR integration
- PDF generation
- clean component structure

<hr>

### 👩‍💻 Author

Renumol Reinhardt