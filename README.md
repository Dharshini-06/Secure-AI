# 🔐 SecureAI — AI Powered Security Scanner

SecureAI is a full-stack web application that detects **phishing messages, unsafe URLs, and weak passwords** using intelligent rule-based and AI-driven analysis.

---

## 🚀 Features

* 🔗 URL Scanner → Detects unsafe / malicious websites
* 💬 Message Scanner → Identifies phishing messages
* 🔑 Password Checker → Evaluates password strength
* 📊 Dashboard → Tracks scan activity
* 🗄️ Supabase Integration → Stores all scan results

---

## 🧠 Technologies Used

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Python (FastAPI)
* **Database**: Supabase
* **Server**: Uvicorn

---

## 📁 Project Structure

```
Secure-AI/
│── index.html
│── style.css
│── script.js
│── main.py
│── supabase_db.py
│── message_analyzer.py
│── password_checker.py
│── dashboard_data.py
│── .env
│── requirements.txt
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Dharshini-06/Secure-AI.git
cd Secure-AI
```

---

### 2️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

### 4️⃣ Run Backend

```bash
uvicorn main:app --reload
```

---

### 5️⃣ Run Frontend

```bash
python -m http.server 5500
```

Open in browser:

```
http://localhost:5500
```

---

## 📊 Database Table (Supabase)

**Table Name:** `scan_logs`

| Column     | Type    |
| ---------- | ------- |
| id         | uuid    |
| type       | varchar |
| input_data | text    |
| result     | varchar |
| score      | int     |

---

## 🎯 How It Works

1. User inputs URL / Message / Password
2. Frontend sends request to FastAPI backend
3. Backend analyzes using detection logic
4. Result is stored in Supabase
5. UI displays result

---

## 📌 Future Improvements

* Add Machine Learning model
* Real-time threat detection
* Browser extension integration
* User authentication

---

## 👩‍💻 Author

**Dharshini G**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
