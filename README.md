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
├── user-display.html             # 👤 Код для отображения данных в Zero Block
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

### `GET /user-full-data`
Получение полных данных пользователя со всеми связанными таблицами
```javascript
{
  "success": true,
  "user": {
    // Основные поля пользователя
    "id": "uuid",
    "email": "user@example.com",
    "name": "Имя Пользователя",
    "referral_code": "ABC123",
    "balance_kgs": 1500.50,
    "total_earned": 2500.00,
    
    // Массивы связанных данных
    "courses": [...],              // Курсы пользователя
    "payments": [...],             // Платежи пользователя
    "referral_transactions": [...], // Реферальные транзакции
    "referral_history": [...],     // История рефералов
    
    // Статистика
    "stats": {
      "total_courses": 3,
      "total_payments": 5,
      "completed_payments": 4,
      "pending_payments": 1,
      "total_referral_earnings": 750.00
    }
  }
}
```

## 🗄️ Расширенная база данных

### 📊 Система теперь работает с 5 таблицами:

1. **`users`** - основная информация пользователей
2. **`user_courses`** - курсы пользователей  
3. **`payments`** - платежи пользователей
4. **`referral_transactions`** - реферальные транзакции
5. **`referral_history`** - детальная история рефералов

Сервер автоматически получает ВСЕ данные из всех связанных таблиц. Вы можете отображать любые поля из любой таблицы.

## 🔧 Настройка элементов

### 📊 Доступные типы данных для отображения:

#### 🔹 Основные поля пользователя:
- `name`, `email`, `referral_code`, `balance_kgs`, `total_earned` и др.

#### 🔹 Статистика (из объекта stats):
- `stats.total_courses`, `stats.total_payments`, `stats.completed_payments` и др.

#### 🔹 Количество элементов в массивах:
- `courses.length`, `payments.length`, `referral_transactions.length` и др.

#### 🔹 Данные из массивов (последние записи):
- `payments.0.amount` - сумма последнего платежа
- `payments.0.status` - статус последнего платежа
- `referral_transactions.0.amount` - сумма последней реферальной транзакции

### ⚙️ Настройка USER_ELEMENTS для Zero Block

В файле `user-display.html` найдите и настройте объект `USER_ELEMENTS` под ваш Zero Block:

```javascript
const USER_ELEMENTS = {
    // Формат: 'CSS селектор': 'поле_из_базы_данных'
    
    // Замените rec1235790536 на ID вашего Zero Block:
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

### 🎨 Важно: Стили НЕ изменяются!

✅ **Система только заменяет текст в элементах**  
✅ **Все стили Zero Block остаются без изменений**  
✅ **Шрифты, цвета, размеры - всё остается как вы настроили**  

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