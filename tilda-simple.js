// Упрощенная версия для тестирования
// Вставьте этот код в блок T123 (HTML) на вашем сайте Tilda

<script>
// URL вашего Railway приложения
const SERVER_URL = 'https://tilda-supabase-server-nodejs-20.up.railway.app';

// Простая функция для тестирования
async function testConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/`, {
            method: 'GET',
            mode: 'cors'
        });
        const text = await response.text();
        console.log('Тест соединения:', text);
        alert('Соединение работает: ' + text);
    } catch (error) {
        console.error('Ошибка соединения:', error);
        alert('Ошибка соединения: ' + error.message);
    }
}

// Функция для получения пользователя по email
async function getUserByEmail(email) {
    try {
        const response = await fetch(`${SERVER_URL}/get-user?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Данные пользователя:', data);
        
        if (data.success && data.user) {
            alert(`Пользователь найден: ${data.user.name || data.user.email}`);
            return data.user;
        } else {
            alert('Пользователь не найден');
            return null;
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
        return null;
    }
}

// Добавляем кнопки для тестирования
document.addEventListener('DOMContentLoaded', function() {
    // Создаем панель для тестирования
    const testPanel = document.createElement('div');
    testPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #fff;
        border: 2px solid #333;
        padding: 10px;
        z-index: 9999;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    testPanel.innerHTML = `
        <h4>Тест интеграции</h4>
        <button onclick="testConnection()">Тест соединения</button><br><br>
        <input type="email" id="testEmail" placeholder="Введите email" style="width: 200px;"><br><br>
        <button onclick="getUserByEmail(document.getElementById('testEmail').value)">Получить пользователя</button>
    `;
    
    document.body.appendChild(testPanel);
});
</script>