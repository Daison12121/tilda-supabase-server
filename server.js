import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Упрощенные CORS настройки для тестирования
app.use(cors({
  origin: '*', // Разрешаем все домены
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json());

// Логирование всех запросов для отладки
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.get('Origin'));
  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Проверка сервера
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Webhook Tilda — POST
app.post("/tilda-webhook", async (req, res) => {
  try {
    console.log("Получен POST /tilda-webhook");
    console.log("Тело запроса:", req.body);

    // Тестовый запрос Tilda
    if (req.body.test) {
      return res.status(200).json({ success: true });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email обязателен" });
    }

    // Получаем пользователя по email
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code === "PGRST116") {
      // Пользователь не найден
      return res.json({ success: true, user: null });
    } else if (error) {
      throw error;
    }

    console.log("Пользователь найден:", data);
    res.json({ success: true, user: data });
  } catch (err) {
    console.error("Ошибка webhook:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /auth-sync — синхронизация авторизации с Tilda
app.post("/auth-sync", async (req, res) => {
  try {
    console.log('POST /auth-sync запрос:', req.body);
    
    const { email, action, timestamp, source, page } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    console.log(`🔐 Синхронизация авторизации: ${email} (${action})`);

    // Сохраняем информацию об авторизации в памяти сервера
    if (!global.authSessions) {
      global.authSessions = new Map();
    }
    
    global.authSessions.set(email, {
      email,
      action,
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'unknown',
      page: page || 'unknown',
      lastActivity: new Date().toISOString()
    });

    console.log('✅ Сессия авторизации сохранена:', email);
    
    // Получаем данные пользователя из Supabase
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    let userFound = false;
    if (!error && userData) {
      userFound = true;
      console.log('👤 Пользователь найден в базе:', userData);
    } else {
      console.log('⚠️ Пользователь не найден в базе:', email);
    }
    
    res.json({ 
      success: true, 
      message: "Auth sync successful",
      email: email,
      userFound: userFound,
      user: userData || null,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ Ошибка в /auth-sync:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Auth sync failed"
    });
  }
});

// GET /current-user — получение текущего авторизованного пользователя
app.get("/current-user", async (req, res) => {
  try {
    console.log('GET /current-user запрос');
    
    if (!global.authSessions) {
      return res.json({ 
        success: true, 
        user: null,
        message: "No active sessions"
      });
    }

    // Находим последнюю активную сессию
    let latestSession = null;
    let latestTime = 0;
    
    for (const [email, session] of global.authSessions.entries()) {
      const sessionTime = new Date(session.timestamp).getTime();
      if (sessionTime > latestTime) {
        latestTime = sessionTime;
        latestSession = session;
      }
    }

    if (!latestSession) {
      return res.json({ 
        success: true, 
        user: null,
        message: "No active sessions found"
      });
    }

    console.log('🔍 Найдена активная сессия:', latestSession.email);

    // Получаем данные пользователя из Supabase
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", latestSession.email)
      .single();

    if (error && error.code === "PGRST116") {
      return res.json({ 
        success: true, 
        user: null,
        session: latestSession,
        message: "User not found in database"
      });
    } else if (error) {
      throw error;
    }

    console.log('✅ Данные текущего пользователя:', data);
    
    res.json({ 
      success: true, 
      user: data,
      session: latestSession,
      message: "Current user found"
    });

  } catch (err) {
    console.error('❌ Ошибка в /current-user:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Failed to get current user"
    });
  }
});

// GET /get-user — получение пользователя по email
app.get("/get-user", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email обязателен" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code === "PGRST116") {
      return res.json({ success: true, user: null });
    } else if (error) {
      throw error;
    }

    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server запущен на порту " + (process.env.PORT || 3000));
});
