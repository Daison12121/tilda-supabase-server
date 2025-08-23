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
  res.send("Server is running! Version 2.0 with auth system");
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

// GET /user-full-data — получение полных данных пользователя со всеми связанными таблицами
app.get("/user-full-data", async (req, res) => {
  try {
    console.log('GET /user-full-data запрос');
    
    // Получаем email из параметров или из активной сессии
    let email = req.query.email;
    
    if (!email) {
      // Если email не передан, ищем в активных сессиях
      if (!global.authSessions) {
        return res.json({ 
          success: true, 
          user: null,
          message: "No email provided and no active sessions"
        });
      }

      // Находим последнюю активную сессию
      let latestSession = null;
      let latestTime = 0;
      
      for (const [sessionEmail, session] of global.authSessions.entries()) {
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
      
      email = latestSession.email;
    }

    console.log('🔍 Получаем полные данные для пользователя:', email);

    // 1. Получаем основные данные пользователя
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code === "PGRST116") {
      return res.json({ 
        success: true, 
        user: null,
        message: "User not found in database"
      });
    } else if (userError) {
      throw userError;
    }

    console.log('✅ Основные данные пользователя получены');

    // 2. Получаем курсы пользователя
    const { data: userCourses, error: coursesError } = await supabase
      .from("user_courses")
      .select("*")
      .eq("user_id", userData.id);

    if (coursesError) {
      console.warn('⚠️ Ошибка получения курсов:', coursesError);
    }

    // 3. Получаем платежи пользователя
    const { data: userPayments, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userData.id)
      .order("paid_at", { ascending: false });

    if (paymentsError) {
      console.warn('⚠️ Ошибка получения платежей:', paymentsError);
    }

    // 4. Получаем реферальные транзакции пользователя (где он получатель)
    const { data: referralTransactions, error: transactionsError } = await supabase
      .from("referral_transactions")
      .select("*")
      .eq("referrer_id", userData.id)
      .order("transaction_date", { ascending: false });

    if (transactionsError) {
      console.warn('⚠️ Ошибка получения реферальных транзакций:', transactionsError);
    }

    // 5. Получаем историю рефералов (детальная информация)
    const { data: referralHistory, error: historyError } = await supabase
      .from("referral_history")
      .select("*")
      .eq("referrer_id", userData.id)
      .order("transaction_date", { ascending: false });

    if (historyError) {
      console.warn('⚠️ Ошибка получения истории рефералов:', historyError);
    }

    // 6. Получаем реферальные транзакции где пользователь является источником
    const { data: userAsSourceTransactions, error: sourceTransactionsError } = await supabase
      .from("referral_transactions")
      .select("*")
      .eq("user_id", userData.id)
      .order("transaction_date", { ascending: false });

    if (sourceTransactionsError) {
      console.warn('⚠️ Ошибка получения транзакций как источник:', sourceTransactionsError);
    }

    // Формируем полный ответ
    const fullUserData = {
      // Основные данные пользователя
      ...userData,
      
      // Дополнительные данные
      courses: userCourses || [],
      payments: userPayments || [],
      referral_transactions: referralTransactions || [],
      referral_history: referralHistory || [],
      user_transactions: userAsSourceTransactions || [],
      
      // Статистика
      stats: {
        total_courses: (userCourses || []).length,
        total_payments: (userPayments || []).length,
        total_referral_transactions: (referralTransactions || []).length,
        total_referral_history: (referralHistory || []).length,
        completed_payments: (userPayments || []).filter(p => p.status === 'completed').length,
        pending_payments: (userPayments || []).filter(p => p.status === 'pending').length,
        total_referral_earnings: (referralTransactions || []).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      }
    };

    console.log('🎉 Полные данные пользователя собраны:', {
      email: userData.email,
      courses: fullUserData.courses.length,
      payments: fullUserData.payments.length,
      referral_transactions: fullUserData.referral_transactions.length,
      referral_history: fullUserData.referral_history.length
    });

    res.json({ 
      success: true, 
      user: fullUserData,
      message: "Full user data retrieved successfully"
    });

  } catch (err) {
    console.error('❌ Ошибка в /user-full-data:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Failed to get full user data"
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server запущен на порту " + (process.env.PORT || 3000));
});
