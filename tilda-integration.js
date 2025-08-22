// JavaScript код для интеграции с Tilda
// Вставьте этот код в блок T123 (HTML) на вашем сайте Tilda

(function() {
    'use strict';
    
    // URL вашего сервера на Railway
    const SERVER_URL = 'https://tilda-supabase-server-nodejs-20.up.railway.app';
    
    // Функция для получения данных пользователя
    async function getUserData(email) {
        try {
            console.log('Запрашиваем данные для email:', email);
            
            const response = await fetch(`${SERVER_URL}/get-user?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Получены данные пользователя:', data);
            
            return data;
        } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
            return null;
        }
    }
    
    // Функция для автозаполнения полей формы
    function fillFormFields(userData) {
        if (!userData || !userData.user) {
            console.log('Нет данных пользователя для автозаполнения');
            return;
        }
        
        const user = userData.user;
        console.log('Автозаполняем поля формы:', user);
        
        // Заполняем поля по их name или id
        const fieldsMap = {
            'name': user.name || user.full_name || '',
            'phone': user.phone || '',
            'email': user.email || '',
            // Добавьте другие поля по необходимости
        };
        
        Object.keys(fieldsMap).forEach(fieldName => {
            const field = document.querySelector(`input[name="${fieldName}"], input[id="${fieldName}"]`);
            if (field && fieldsMap[fieldName]) {
                field.value = fieldsMap[fieldName];
                console.log(`Заполнено поле ${fieldName}:`, fieldsMap[fieldName]);
            }
        });
    }
    
    // Функция для проверки авторизации Tilda
    function checkTildaAuth() {
        // Проверяем наличие данных авторизации в localStorage или cookies
        const tildaUser = localStorage.getItem('tildaUser') || 
                         getCookie('tilda_user') || 
                         getCookie('tilda_member');
        
        if (tildaUser) {
            try {
                const userData = JSON.parse(tildaUser);
                if (userData.email) {
                    console.log('Найден авторизованный пользователь Tilda:', userData.email);
                    return userData.email;
                }
            } catch (e) {
                console.log('Ошибка парсинга данных пользователя Tilda:', e);
            }
        }
        
        return null;
    }
    
    // Функция для получения cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // Функция для отслеживания событий авторизации Tilda
    function setupTildaAuthListener() {
        // Слушаем события Tilda
        window.addEventListener('tilda:member:login', function(event) {
            console.log('Событие входа Tilda:', event);
            if (event.detail && event.detail.email) {
                setTimeout(() => {
                    getUserData(event.detail.email).then(fillFormFields);
                }, 500);
            }
        });
        
        window.addEventListener('tilda:member:register', function(event) {
            console.log('Событие регистрации Tilda:', event);
            if (event.detail && event.detail.email) {
                setTimeout(() => {
                    getUserData(event.detail.email).then(fillFormFields);
                }, 500);
            }
        });
        
        // Также проверяем при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                const email = checkTildaAuth();
                if (email) {
                    getUserData(email).then(fillFormFields);
                }
            }, 1000);
        });
    }
    
    // Альтернативный метод - отслеживание изменений в формах
    function setupFormListener() {
        document.addEventListener('input', function(event) {
            if (event.target.type === 'email' && event.target.value.includes('@')) {
                const email = event.target.value;
                // Добавляем небольшую задержку, чтобы пользователь закончил ввод
                clearTimeout(window.emailTimeout);
                window.emailTimeout = setTimeout(() => {
                    getUserData(email).then(fillFormFields);
                }, 1000);
            }
        });
    }
    
    // Инициализация
    function init() {
        console.log('Инициализация интеграции с Tilda...');
        setupTildaAuthListener();
        setupFormListener();
        
        // Проверяем сразу при загрузке
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    const email = checkTildaAuth();
                    if (email) {
                        getUserData(email).then(fillFormFields);
                    }
                }, 1000);
            });
        } else {
            setTimeout(() => {
                const email = checkTildaAuth();
                if (email) {
                    getUserData(email).then(fillFormFields);
                }
            }, 1000);
        }
    }
    
    // Запускаем инициализацию
    init();
    
})();