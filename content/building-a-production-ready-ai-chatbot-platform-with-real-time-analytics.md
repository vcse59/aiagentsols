---
title: Building a Production-Ready AI ChatBot Platform with Real-Time Analytics
author:  
tags: openai, ai, oauth, analytics
canonical_url: https://dev.to/vivekyadav200988/building-a-production-ready-ai-chatbot-platform-with-real-time-analytics-4ioe
cover_image: https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Ftdeoqpiet3sreo5fp362.png
published: true
date: 2025-11-16
description: A comprehensive guide to building a production-ready AI chatbot platform featuring OAuth 2.0, real-time WebSocket communication, OpenAI integration, and a full-featured analytics dashboard using a microservices architecture.
---

## 🎯 Introduction

In this article, I'll walk you through the architecture and implementation of a complete, production-ready AI chatbot platform that I've built from scratch. This isn't just another chatbot tutorial—it's a comprehensive system featuring OAuth 2.0 authentication, real-time WebSocket communication, OpenAI integration, and a full-featured analytics dashboard.

What makes this project special?

- 🏗️ **Microservices Architecture**: Four independent services working together seamlessly
- 🔒 **Enterprise-Grade Security**: OAuth 2.0 with JWT tokens and role-based access control
- 💬 **Real-Time Communication**: WebSocket support for instant messaging
- 📊 **Integrated Analytics**: Live metrics and user activity tracking
- 🚀 **Production Ready**: Docker deployment, comprehensive testing, and cross-platform support
- 🎨 **Modern UI**: Beautiful React interface with gradient themes and responsive design

**Tech Stack:**
- Frontend: React 18, React Router, WebSocket API
- Backend: FastAPI (Python 3.12+), SQLAlchemy, JWT
- AI: OpenAI GPT-4
- Database: SQLite (easily upgradeable to PostgreSQL)
- Deployment: Docker, Docker Compose
- Testing: Pytest, end-to-end test suite

## 🏗️ System Architecture

The platform consists of four microservices:

```
┌────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)               │
│  Chat Interface + Analytics Panel + Real-time Updates      │
└──────────────┬─────────────────────────────────────────────┘
               │
               ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │  Auth Service    │  │  Chat Service    │  │Analytics Service │
    │  (Port 8001)     │  │  (Port 8000)     │  │  (Port 8002)     │
    │                  │  │                  │  │                  │
    │ • User Mgmt      │  │ • Conversations  │  │ • Metrics        │
    │ • JWT Tokens     │◄─┤ • OpenAI API     │─►│ • User Activity  │
    │ • RBAC           │  │ • WebSocket      │  │ • Token Tracking │
    │ • Auto Admin     │  │ • Analytics MW   │  │ • Admin API      │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Why Microservices?

1. **Separation of Concerns**: Each service has a single, well-defined responsibility
2. **Scalability**: Scale services independently based on load
3. **Maintainability**: Easier to understand, test, and modify individual components
4. **Technology Flexibility**: Each service can use different technologies if needed
5. **Fault Isolation**: If one service fails, others continue functioning

## 🔐 Authentication & Authorization

### OAuth 2.0 Implementation

The auth service implements OAuth 2.0 with JWT tokens:

```python
# auth-service/auth_server/security/auth.py
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

Key Features:
- **BCrypt Password Hashing**: Secure password storage with automatic salting
- **JWT Tokens**: Stateless authentication with 30-day expiration
- **Role-Based Access Control**: Admin, User, Manager roles
- **Timezone-Aware**: UTC timestamps for global compatibility

### Automatic Admin Setup

One of my favorite features—the system automatically creates an admin user on first startup:

```python
# auth-service/auth_server/main.py
@app.on_event("startup")
async def startup_event():
    """Initialize database and create admin user if not exists"""
    create_db_and_tables()

    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")

    with Session(engine) as session:
        admin_user = session.exec(
            select(User).where(User.username == admin_username)
        ).first()

        if not admin_user:
            admin_user = User(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password)
            )
            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)

            admin_role = session.exec(select(Role).where(Role.name == "admin")).first()
            user_role = session.exec(select(Role).where(Role.name == "user")).first()

            admin_user.roles.extend([admin_role, user_role])
            session.commit()

            print(f"✅ Admin user '{admin_username}' created successfully!")
```

## 💬 Real-Time Chat with WebSocket

### WebSocket Connection Handler

```python
# openai_web_service/websocket/chat_handler.py
@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    token: str = Query(None),
    db: Session = Depends(get_db)
):
    await websocket.accept()

    try:
        user_data = verify_access_token(token)
        user_id = user_data.get("user_id")

        conversation = get_conversation_by_id(db, conversation_id, user_id)
        if not conversation:
            await websocket.send_json({
                "type": "error",
                "message": "Conversation not found or access denied"
            })
            await websocket.close()
            return

        while True:
            data = await websocket.receive_json()
            if data.get("type") == "message":
                user_message = create_message(
                    db, conversation_id, "user", data.get("content"), user_id
                )
                ai_response = await get_openai_response(
                    db, conversation_id, user_message.content
                )
                ai_message = create_message(
                    db, conversation_id, "assistant", ai_response, user_id
                )
                await websocket.send_json({
                    "type": "message",
                    "role": "assistant",
                    "content": ai_response,
                    "message_id": ai_message.id,
                    "timestamp": ai_message.timestamp.isoformat()
                })

    except WebSocketDisconnect:
        print(f"Client disconnected from conversation {conversation_id}")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        await websocket.close()
```

### OpenAI Integration

```python
# openai_web_service/services/openai_service.py
async def get_openai_response(db: Session, conversation_id: str, user_message: str) -> str:
    messages = get_messages_by_conversation(db, conversation_id)
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages[-10:]  # Last 10 messages for context
    ]
    conversation_history.insert(0, {
        "role": "system",
        "content": "You are a helpful AI assistant."
    })
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=conversation_history,
        temperature=0.7,
        max_tokens=500
    )
    return response.choices[0].message.content
```

## 📊 Analytics Dashboard

### Real-Time Metrics Tracking

```python
# analytics-service/analytics/services/analytics_service.py
class AnalyticsService:
    def get_summary_metrics(self, db: Session) -> dict:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        return {
            "total_users": db.query(UserActivity).distinct(UserActivity.user_id).count(),
            "active_users_today": db.query(UserActivity)
                .filter(UserActivity.timestamp >= today_start)
                .distinct(UserActivity.user_id)
                .count(),
            "total_conversations": db.query(ConversationMetrics).count(),
            "total_messages": db.query(MessageMetrics).count(),
            "total_tokens_used": db.query(func.sum(MessageMetrics.total_tokens)).scalar() or 0,
            "avg_response_time": db.query(func.avg(ApiUsage.response_time))
                .filter(ApiUsage.timestamp >= today_start)
                .scalar() or 0,
            "error_rate": self._calculate_error_rate(db, today_start)
        }
```

### Analytics Middleware

```python
# openai_web_service/middleware/analytics_middleware.py
@app.middleware("http")
async def analytics_tracking_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    response_time = time.time() - start_time

    user_id = None
    if authorization := request.headers.get("authorization"):
        try:
            token = authorization.split("Bearer ")[1]
            user_data = verify_access_token(token)
            user_id = user_data.get("user_id")
        except:
            pass

    asyncio.create_task(
        send_analytics_event({
            "event_type": "api_request",
            "user_id": user_id,
            "endpoint": str(request.url.path),
            "method": request.method,
            "status_code": response.status_code,
            "response_time": response_time,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    )
    return response
```

## 🐳 Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  auth-service:
    build: ./auth-service
    ports:
      - "8001:8001"
    environment:
      - AUTH_SECRET_KEY=${AUTH_SECRET_KEY}
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin123
    networks:
      - chatbot-network

  openai_web_service:
    build: ./openai_web_service
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - AUTH_SECRET_KEY=${AUTH_SECRET_KEY}
      - AUTH_SERVICE_URL=http://auth-service:8001
      - ANALYTICS_SERVICE_URL=http://analytics-service:8002
    depends_on:
      - auth-service
      - analytics-service
    networks:
      - chatbot-network

  analytics-service:
    build: ./analytics-service
    ports:
      - "8002:8002"
    environment:
      - AUTH_SECRET_KEY=${AUTH_SECRET_KEY}
      - AUTH_SERVICE_URL=http://auth-service:8001
    depends_on:
      - auth-service
    networks:
      - chatbot-network

  chat-frontend:
    build: ./chat-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_AUTH_API_URL=http://localhost:8001
      - REACT_APP_CHAT_API_URL=http://localhost:8000
      - REACT_APP_ANALYTICS_API_URL=http://localhost:8002
      - REACT_APP_WS_URL=ws://localhost:8000
    depends_on:
      - auth-service
      - openai_web_service
      - analytics-service
    networks:
      - chatbot-network

networks:
  chatbot-network:
    driver: bridge
```

Deploy with one command:

```bash
docker-compose up --build
```

## 🛡️ Security Best Practices

1. **Password Security**: BCrypt hashing with automatic salting
2. **JWT Token Security**: HS256 algorithm, 30-day expiration, token refresh mechanism
3. **CORS Configuration**: Whitelist specific origins, no wildcard (*) in production
4. **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
5. **XSS Protection**: React's built-in XSS protection + Content Security Policy headers

## 📦 Project Repository

GitHub: [github.com/vcse59/ConvoAI](https://github.com/vcse59/ConvoAI)

### Quick Start

```bash
# Clone repository
git clone https://github.com/vcse59/ConvoAI.git
cd ConvoAI

# Create .env file
echo "AUTH_SECRET_KEY=your-secret-key" > .env
echo "OPENAI_API_KEY=sk-your-key" >> .env

# Docker deployment
docker-compose up --build

# Or local development (Windows)
scripts\windows\setup-venv.bat
scripts\windows\start-all-services.bat
```

## 📞 Contact

- GitHub: [@vcse59](https://github.com/vcse59/ConvoAI)
- Email: v.cse59@gmail.com
- LinkedIn: [Connect with me](https://www.linkedin.com/in/vivek-yadav-12117517/)
