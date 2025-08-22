import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Простые CORS настройки
app.use(cors({
  origin: '*', // Разрешаем все домены для тестирования
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

// Создаем клиент Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Базовый роут
app.get("/", (req, res) => {
  res.json({ 
    status: "Server is running!",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// Получение пользователя по email
app.get("/get-user", async (req, res) => {
  try {
    console.log('GET /get-user запрос:', req.query);
    
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email parameter is required" 
      });
    }

    console.log('Ищем пользователя с email:', email);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.log('Supabase error:', error);
      
      if (error.code === "PGRST116") {
        // Пользователь не найден
        return res.json({ 
          success: true, 
          user: null,
          message: "User not found"
        });
      }
      
      throw error;
    }

    console.log('Пользователь найден:', data);
    
    res.json({ 
      success: true, 
      user: data,
      message: "User found successfully"
    });

  } catch (err) {
    console.error('Ошибка в /get-user:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Internal server error"
    });
  }
});

// Тестовый роут для проверки Supabase
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .limit(5);

    if (error) throw error;

    res.json({
      success: true,
      message: "Database connection successful",
      userCount: data.length,
      users: data
    });

  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for all origins`);
  console.log(`🔗 Server URL: https://tilda-supabase-server-nodejs-20.up.railway.app`);
});