# 🔧 Примеры настройки USER_ELEMENTS

## 📋 Как настроить отображение данных

В файле `user-display.html` найдите объект `USER_ELEMENTS` и настройте его под ваши нужды:

```javascript
const USER_ELEMENTS = {
    'CSS селектор': 'поле_из_базы_данных',
    // Добавьте свои настройки...
};
```

## 🎯 Примеры для разных случаев

### 1. Zero Block с конкретным ID
```javascript
const USER_ELEMENTS = {
    '#rec1234567890 .t-name': 'name',
    '#rec1234567890 .t-email': 'email',
    '#rec1234567890 .t-phone': 'phone',
    '#rec1234567890 .t-company': 'company',
};
```

### 2. Элементы по классам
```javascript
const USER_ELEMENTS = {
    '.user-name': 'name',
    '.user-email': 'email',
    '.user-phone': 'phone',
    '.contact-info': 'phone',
    '.company-name': 'company',
    '.job-title': 'position',
};
```

### 3. Элементы по ID
```javascript
const USER_ELEMENTS = {
    '#userName': 'name',
    '#userEmail': 'email',
    '#userPhone': 'phone',
    '#userCompany': 'company',
};
```

### 4. Элементы по атрибутам
```javascript
const USER_ELEMENTS = {
    '[data-user="name"]': 'name',
    '[data-user="email"]': 'email',
    '[data-user="phone"]': 'phone',
    '[data-field="company"]': 'company',
};
```

### 5. Вложенные элементы
```javascript
const USER_ELEMENTS = {
    '.profile-card .name': 'name',
    '.profile-card .email': 'email',
    '.contact-section .phone': 'phone',
    '.work-info .company': 'company',
    '.work-info .position': 'position',
};
```

### 6. Множественные элементы (один селектор = несколько элементов)
```javascript
const USER_ELEMENTS = {
    '.user-name, .profile-name, .header-name': 'name',
    '.user-email, .contact-email': 'email',
    '.user-phone, .contact-phone': 'phone',
};
```

## 📊 Реальные поля вашей базы данных

В вашей таблице `users` доступны следующие поля:

```javascript
const USER_ELEMENTS = {
    // Основная информация:
    '.user-id': 'id',                    // UUID пользователя
    '.user-name': 'name',                // Имя пользователя
    '.user-email': 'email',              // Email пользователя
    '.created-date': 'created_at',       // Дата регистрации
    '.auth-uid': 'auth_uid',             // UID авторизации
    
    // Реферальная система:
    '.referral-code': 'referral_code',   // Реферальный код пользователя
    '.referred-by': 'referred_by',       // Кем приглашен (реферальный код)
    '.level-1-refs': 'level_1_referrals', // Количество рефералов 1 уровня
    '.level-2-refs': 'level_2_referrals', // Количество рефералов 2 уровня  
    '.level-3-refs': 'level_3_referrals', // Количество рефералов 3 уровня
    
    // Финансовая информация:
    '.balance': 'balance_kgs',           // Текущий баланс в сомах
    '.total-earned': 'total_earned',     // Всего заработано
};
```

## 🔍 Как узнать доступные поля

1. **Откройте страницу с кодом user-display.html**
2. **Нажмите Ctrl+Shift+U** для открытия отладочной панели
3. **Нажмите "📊 Показать все данные пользователя"**
4. **Откройте консоль браузера (F12)** - там будут все доступные поля

Или нажмите **"📋 Доступные поля базы данных"** для получения готовых примеров.

## 🎨 Примеры для разных дизайнов

### Карточка профиля пользователя
```javascript
const USER_ELEMENTS = {
    '.profile-card .user-name': 'name',
    '.profile-card .user-email': 'email',
    '.profile-card .referral-code': 'referral_code',
    '.profile-card .join-date': 'created_at',
    '.profile-card .balance': 'balance_kgs',
};
```

### Реферальная панель
```javascript
const USER_ELEMENTS = {
    '.referral-panel .my-code': 'referral_code',
    '.referral-panel .level-1': 'level_1_referrals',
    '.referral-panel .level-2': 'level_2_referrals', 
    '.referral-panel .level-3': 'level_3_referrals',
    '.referral-panel .invited-by': 'referred_by',
};
```

### Финансовая статистика
```javascript
const USER_ELEMENTS = {
    '.finance .current-balance': 'balance_kgs',
    '.finance .total-earned': 'total_earned',
    '.finance .refs-count': 'level_1_referrals',
    '.finance .user-name': 'name',
};
```

### Форма редактирования (заполнение полей)
```javascript
const USER_ELEMENTS = {
    'input[name="name"]': 'name',           // Заполнит value
    'input[name="email"]': 'email',
    'input[name="phone"]': 'phone',
    'input[name="company"]': 'company',
};
```

### Таблица данных
```javascript
const USER_ELEMENTS = {
    '.data-table .name-cell': 'name',
    '.data-table .email-cell': 'email',
    '.data-table .phone-cell': 'phone',
    '.data-table .company-cell': 'company',
};
```

### Хедер сайта
```javascript
const USER_ELEMENTS = {
    '.header .user-name': 'name',
    '.header .user-email': 'email',
    '.nav .welcome-text': 'name',
};
```

## ⚠️ Важные моменты

### 1. Селекторы должны быть уникальными
```javascript
// ❌ Плохо - слишком общий селектор
'.name': 'name',

// ✅ Хорошо - конкретный селектор
'#rec1234567890 .t-name': 'name',
```

### 2. Поля должны существовать в базе
```javascript
// ✅ Поле существует в базе
'.user-name': 'name',

// ❌ Поле не существует в базе
'.user-age': 'age',  // Если поля 'age' нет в таблице
```

### 3. Элементы должны существовать на странице
```javascript
// ✅ Элемент существует на странице
'.existing-element': 'name',

// ❌ Элемент не существует на странице
'.non-existing-element': 'name',
```

## 🧪 Тестирование настроек

1. **Настройте USER_ELEMENTS**
2. **Сохраните и обновите страницу**
3. **Нажмите Ctrl+Shift+U**
4. **Используйте кнопки отладки:**
   - 🎯 Показать элементы - проверит найденные элементы
   - 📊 Показать все данные - покажет доступные поля
   - 🔄 Обновить данные - перезагрузит данные

## 💡 Советы по настройке

1. **Начните с простых селекторов** (по ID или классу)
2. **Используйте отладочную панель** для проверки
3. **Проверяйте консоль браузера** на ошибки
4. **Тестируйте по одному элементу** за раз
5. **Используйте инспектор элементов** (F12) для поиска правильных селекторов

---

**Помните:** Система получает ВСЕ поля из таблицы `users`, вы просто указываете какие из них где отображать!