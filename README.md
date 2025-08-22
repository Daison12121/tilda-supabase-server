# 🚀 Tilda + Supabase Auth System

Система авторизации и отображения данных пользователей для сайтов на Tilda с базой данных Supabase.

## 📋 Описание

Эта система позволяет:
- ✅ Перехватывать авторизацию на формах Tilda
- ✅ Автоматически отображать данные пользователя на страницах
- ✅ Синхронизировать сессии между страницами
- ✅ Работать без изменения стандартных форм Tilda

## 🏗️ Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tilda Forms   │───▶│   Node.js API    │───▶│   Supabase DB   │
│  (auth-inter.)  │    │   (server.js)    │    │   (users table) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Tilda Pages    │◀───│  Session Store   │◀───│  User Data API  │
│ (user-display)  │    │  (in memory)     │    │  (REST calls)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Структура проекта

```
tilda-supabase-server/
├── server.js                      # 🖥️  Основной сервер (Node.js + Express)
├── auth-interceptor.html          # 🔐 Код для страницы авторизации
├── user-display.html             # 👤 Код для отображения данных пользователя
├── test-auth.html                # 🧪 Страница для тестирования авторизации
├── test-database-fields.html     # 🗄️  Тестирование полей базы данных
├── CONFIGURATION_EXAMPLES.md     # 🔧 Примеры настройки элементов
├── DEPLOYMENT.md                 # 🚀 Инструкция по развертыванию
├── package.json                  # 📦 Зависимости проекта
├── .env                          # 🔑 Переменные окружения (Supabase)
└── README.md                    # 📖 Основная документация
```

## 🚀 Быстрый старт

### 1. Настройка сервера

Сервер уже развернут на Railway: `https://tilda-supabase-server-nodejs-20.up.railway.app`

### 2. Настройка авторизации

1. **Скопируйте код из `auth-interceptor.html`**
2. **Вставьте в блок T123 на странице авторизации Tilda**
3. **Опубликуйте страницу**

### 3. Настройка отображения данных

1. **Создайте Zero Block с элементами:**
   ```html
   <div class="t-name">Имя пользователя</div>
   <div class="t-email">Email пользователя</div>
   <div class="t-phone">Телефон пользователя</div>
   ```

2. **Скопируйте код из `user-display.html`**
3. **Вставьте в блок T123 на странице с данными**
4. **Опубликуйте страницу**

## 🎯 API Endpoints

### `POST /auth-sync`
Синхронизация авторизации пользователя
```javascript
{
  "email": "user@example.com",
  "action": "login",
  "timestamp": "2024-01-01T12:00:00Z",
  "source": "tilda_form",
  "page": "https://example.com/login"
}
```

### `GET /current-user`
Получение текущего авторизованного пользователя
```javascript
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "Имя Пользователя",
    "phone": "+996123456789"
  }
}
```

### `GET /get-user?email=user@example.com`
Получение пользователя по email
```javascript
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "Имя Пользователя",
    "phone": "+996123456789"
  }
}
```

## 🔧 Настройка элементов

### 📊 Система получает ВСЕ поля из таблицы users

Сервер автоматически получает все поля из вашей таблицы Supabase (`SELECT *`). Вы просто указываете какие поля где отображать.

### ⚙️ Настройка USER_ELEMENTS

В файле `user-display.html` найдите и настройте объект `USER_ELEMENTS`:

```javascript
const USER_ELEMENTS = {
    // Формат: 'CSS селектор': 'поле_из_базы_данных'
    
    // Основная информация:
    '#rec1235790536 .t-name': 'name',                    // Имя пользователя
    '#rec1235790536 .t-email': 'email',                  // Email пользователя  
    '#rec1235790536 .t-referral-code': 'referral_code',  // Реферальный код
    '#rec1235790536 .t-balance': 'balance_kgs',          // Баланс в сомах
    '#rec1235790536 .t-earned': 'total_earned',          // Всего заработано
    
    // ДОСТУПНЫЕ ПОЛЯ ИЗ ВАШЕЙ БАЗЫ ДАННЫХ:
    // '.user-id': 'id',                        // UUID пользователя
    // '.user-name': 'name',                    // Имя пользователя
    // '.user-email': 'email',                  // Email пользователя
    // '.created-date': 'created_at',           // Дата регистрации
    // '.auth-uid': 'auth_uid',                 // UID авторизации
    // '.referral-code': 'referral_code',       // Реферальный код
    // '.referred-by': 'referred_by',           // Кем приглашен
    // '.balance': 'balance_kgs',               // Баланс в сомах
    // '.total-earned': 'total_earned',         // Всего заработано
    // '.level-1-refs': 'level_1_referrals',    // Рефералы 1 уровня
    // '.level-2-refs': 'level_2_referrals',    // Рефералы 2 уровня
    // '.level-3-refs': 'level_3_referrals',    // Рефералы 3 уровня
    
    // Разные типы селекторов:
    // '.profile .user-name': 'name',           // Вложенные элементы
    // '#user-balance': 'balance_kgs',          // По ID
    // '[data-field="referral"]': 'referral_code', // По атрибуту
};
```

### 🔍 Как узнать доступные поля

1. **Откройте страницу с user-display.html**
2. **Нажмите Ctrl+Shift+U** (отладочная панель)
3. **Нажмите "📊 Показать все данные пользователя"**
4. **Откройте консоль (F12)** - увидите все поля

Или используйте тестовую страницу: `test-database-fields.html`

## 🧪 Отладка

### Для страницы авторизации:
- Нажмите **Ctrl+Shift+A** для открытия отладочной панели
- Используйте кнопки для тестирования перехвата форм

### Для страницы отображения данных:
- Нажмите **Ctrl+Shift+U** для открытия отладочной панели
- Используйте кнопки для тестирования загрузки данных

## 🗄️ База данных

Структура таблицы `users` в Supabase:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auth_uid VARCHAR(255),
    referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50),
    balance_kgs DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    level_1_referrals INTEGER DEFAULT 0,
    level_2_referrals INTEGER DEFAULT 0,
    level_3_referrals INTEGER DEFAULT 0
);
```

### 📊 Доступные поля:
- **id** - UUID пользователя
- **email** - Email пользователя  
- **name** - Имя пользователя
- **created_at** - Дата регистрации
- **auth_uid** - UID авторизации
- **referral_code** - Уникальный реферальный код
- **referred_by** - Реферальный код пригласившего
- **balance_kgs** - Текущий баланс в сомах
- **total_earned** - Общая сумма заработка
- **level_1_referrals** - Количество рефералов 1 уровня
- **level_2_referrals** - Количество рефералов 2 уровня  
- **level_3_referrals** - Количество рефералов 3 уровня

## 🔒 Безопасность

- ✅ CORS настроен для работы с доменами Tilda
- ✅ Валидация email адресов
- ✅ Защита от SQL инъекций через Supabase
- ✅ Сессии хранятся в памяти сервера (не в cookies)

## 🚨 Устранение неполадок

### Проблема: Данные не отображаются
1. Проверьте селекторы в `USER_ELEMENTS`
2. Убедитесь, что пользователь авторизован
3. Откройте консоль браузера (F12) для просмотра ошибок

### Проблема: Авторизация не работает
1. Проверьте, что код вставлен в блок T123
2. Убедитесь, что форма имеет поле email
3. Проверьте консоль браузера на ошибки

### Проблема: Сервер недоступен
1. Проверьте статус Railway: https://railway.app
2. Убедитесь, что URL сервера корректный
3. Проверьте настройки CORS

## 📞 Поддержка

Для получения помощи:
1. Откройте консоль браузера (F12)
2. Найдите сообщения с префиксами 🔐, 👤, ✅, ❌
3. Используйте отладочные панели (Ctrl+Shift+A/U)

## 🔄 Обновления

Система автоматически обновляет данные каждые 30 секунд и поддерживает:
- ✅ Автоматическое восстановление соединения
- ✅ Кеширование данных пользователя
- ✅ Индикаторы загрузки и ошибок
- ✅ Периодическую синхронизацию

---

**Версия:** 2.0  
**Статус:** ✅ Готово к использованию  
**Сервер:** https://tilda-supabase-server-nodejs-20.up.railway.app