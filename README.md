# Tilda-Supabase Integration

Сервер для интеграции Tilda с Supabase для автоматического подтягивания данных пользователей.

## Проблемы и решения

### Основные проблемы при интеграции с Tilda:

1. **CORS ошибки** - Tilda может отправлять запросы с разных доменов
2. **Отсутствие событий авторизации** - Стандартная система членства Tilda не всегда генерирует события
3. **Ограничения безопасности браузера** - Блокировка cross-origin запросов

### Решения:

#### 1. Настройка CORS
Сервер настроен для работы с:
- Вашим основным доменом (aida.kg)
- Всеми поддоменами Tilda (*.tilda.ws, *.tilda.cc)
- Tilda CDN (*.tildacdn.com)

#### 2. Способы интеграции:

**Способ 1: Тестовая панель (рекомендуется для начала)**
```html
<!-- Вставьте в блок T123 (HTML) -->
<script src="https://your-railway-app.railway.app/tilda-simple.js"></script>
```

**Способ 2: Полная интеграция**
```html
<!-- Вставьте в блок T123 (HTML) -->
<script src="https://your-railway-app.railway.app/tilda-integration.js"></script>
```

**Способ 3: Ручная интеграция**
```javascript
// Добавьте в блок T123 (HTML)
<script>
const SERVER_URL = 'https://your-railway-app.railway.app';

async function getUserData(email) {
    try {
        const response = await fetch(`${SERVER_URL}/get-user?email=${email}`, {
            method: 'GET',
            mode: 'cors'
        });
        const data = await response.json();
        
        if (data.success && data.user) {
            // Заполняем поля формы
            const nameField = document.querySelector('input[name="name"]');
            const phoneField = document.querySelector('input[name="phone"]');
            
            if (nameField && data.user.name) nameField.value = data.user.name;
            if (phoneField && data.user.phone) phoneField.value = data.user.phone;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Вызывайте эту функцию после авторизации пользователя
// getUserData('user@example.com');
</script>
```

## Отладка

### 1. Проверьте логи сервера
Сервер логирует все входящие запросы. Проверьте логи Railway для диагностики.

### 2. Проверьте консоль браузера
Откройте DevTools (F12) и проверьте:
- Ошибки CORS
- Сетевые запросы
- JavaScript ошибки

### 3. Тестовые запросы
```bash
# Тест основного эндпоинта
curl https://your-railway-app.railway.app/

# Тест получения пользователя
curl "https://your-railway-app.railway.app/get-user?email=test@example.com"
```

## Возможные проблемы

### 1. CORS ошибки
**Симптом:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Решение:** 
- Убедитесь, что ваш домен добавлен в CORS настройки
- Проверьте, что запрос идет с правильного домена

### 2. Tilda не отправляет события
**Симптом:** События `tilda:member:login` не срабатывают

**Решение:**
- Используйте отслеживание изменений в полях email
- Добавьте кнопку для ручного запроса данных
- Проверьте настройки системы членства в Tilda

### 3. Данные не заполняются
**Симптом:** Запрос проходит, но поля формы не заполняются

**Решение:**
- Проверьте селекторы полей формы
- Убедитесь, что поля имеют правильные name/id атрибуты
- Добавьте задержку перед заполнением полей

## Настройка Railway

1. Убедитесь, что переменные окружения настроены:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PORT` (обычно устанавливается автоматически)

2. Домен Railway должен быть доступен по HTTPS

3. Замените `https://your-railway-app.railway.app` на ваш реальный URL

## Структура базы данных

Таблица `users` должна содержать поля:
- `email` (string, primary key)
- `name` (string, optional)
- `phone` (string, optional)
- другие поля по необходимости