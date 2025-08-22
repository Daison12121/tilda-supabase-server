# 🚀 Развертывание системы

## 📋 Что нужно для развертывания

### 1. Supabase проект
- Создайте проект на [supabase.com](https://supabase.com)
- Создайте таблицу `users`:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Railway проект
- Создайте проект на [railway.app](https://railway.app)
- Подключите GitHub репозиторий
- Добавьте переменные окружения:
  - `SUPABASE_URL` - URL вашего Supabase проекта
  - `SUPABASE_ANON_KEY` - Anon ключ из Supabase
  - `PORT` - 3000 (или оставьте пустым)

### 3. Настройка файлов
В файлах `auth-interceptor.html` и `user-display.html` замените:
```javascript
const SERVER_URL = 'https://your-app.up.railway.app';
```

## 🔧 Локальная разработка

```bash
# Установка зависимостей
npm install

# Создание .env файла
echo "SUPABASE_URL=your_supabase_url" > .env
echo "SUPABASE_ANON_KEY=your_anon_key" >> .env

# Запуск сервера
npm start
```

## 📦 Структура .env

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
```

## 🚀 Автоматическое развертывание

При push в main ветку Railway автоматически:
1. Скачивает код
2. Устанавливает зависимости (`npm ci`)
3. Запускает сервер (`npm start`)
4. Делает приложение доступным по HTTPS

## ✅ Проверка развертывания

1. Откройте `https://your-app.up.railway.app`
2. Должно появиться: "Server is running! Version 2.0 with auth system"
3. Проверьте endpoints:
   - `/current-user` - должен вернуть JSON
   - `/get-user?email=test@test.com` - должен вернуть JSON

## 🔄 Обновление

Для обновления системы:
1. Внесите изменения в код
2. Сделайте commit и push
3. Railway автоматически пересоберет приложение

---

**Время развертывания:** ~5 минут  
**Требования:** Node.js 18+, Supabase проект