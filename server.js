import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Настройка CORS с поддержкой credentials
app.use(cors({
  origin: [
    'https://aida.kg', 
    'https://www.aida.kg',
    'https://aida-kg.tilda.ws',
    'https://tilda.cc',
    'https://project7777777.tilda.ws',
    'http://localhost:3000', 
    'http://127.0.0.1:3000'
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true, // Включаем поддержку куков
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Browser-ID"]
}));

// Настройка куков и сессий
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'tilda-supabase-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // В продакшене должно быть true для HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
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
    console.log('🍪 Session ID:', req.sessionID);
    console.log('🍪 Session data before:', req.session);
    console.log('🆔 Browser ID from header:', req.headers['x-browser-id']);
    console.log('🆔 Browser ID from body:', req.body.browser_id);
    
    const { email, action, timestamp, source, page, browser_id } = req.body;
    const browserId = browser_id || req.sessionID;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    console.log(`🔐 Синхронизация авторизации: ${email} (${action}) [${browserId}]`);

    // Сохраняем информацию об авторизации в сессии пользователя
    req.session.userEmail = email;
    req.session.userAction = action;
    req.session.browserId = browserId;
    req.session.loginTimestamp = timestamp || new Date().toISOString();
    req.session.source = source || 'unknown';
    req.session.page = page || 'unknown';
    req.session.lastActivity = new Date().toISOString();

    // Сохраняем в глобальной памяти с Browser ID как ключом
    if (!global.browserSessions) {
      global.browserSessions = new Map();
    }
    
    global.browserSessions.set(browserId, {
      email,
      action,
      browserId,
      timestamp: timestamp || new Date().toISOString(),
      source: source || 'unknown',
      page: page || 'unknown',
      lastActivity: new Date().toISOString()
    });

    // Также сохраняем в старом формате для совместимости
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

    console.log('✅ Сессия авторизации сохранена в session и global:', email);
    console.log('🍪 Session data after:', req.session);
    
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
    console.log('🍪 Session ID:', req.sessionID);
    console.log('🍪 Session data:', req.session);
    console.log('🍪 Cookies:', req.cookies);
    console.log('📧 Query email:', req.query.email);
    console.log('🆔 Browser ID from query:', req.query.browser_id);
    console.log('🆔 Browser ID from header:', req.headers['x-browser-id']);
    
    // Получаем Browser ID и email
    const browserId = req.query.browser_id || req.sessionID;
    let email = req.query.email;
    let emailSource = 'query';
    
    if (email) {
      console.log('📧 Email взят из параметров запроса:', email);
    } else {
      // Если email не передан, ищем по Browser ID
      if (global.browserSessions && global.browserSessions.has(browserId)) {
        const browserSession = global.browserSessions.get(browserId);
        email = browserSession.email;
        emailSource = 'browser_session';
        console.log('📧 Email взят из Browser Session:', email, '[', browserId, ']');
      } else if (req.session && req.session.userEmail) {
        email = req.session.userEmail;
        emailSource = 'session';
        console.log('📧 Email взят из сессии пользователя:', email);
      } else {
        // Fallback: ищем в глобальных сессиях (старый способ)
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
        emailSource = 'global_fallback';
        console.log('📧 Email взят из глобальной сессии (fallback):', email);
      }
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
      message: "Full user data retrieved successfully",
      debug: {
        emailSource: emailSource,
        requestedEmail: email,
        browserId: browserId,
        sessionId: req.sessionID,
        hasSession: !!req.session.userEmail,
        hasBrowserSession: !!(global.browserSessions && global.browserSessions.has(browserId))
      }
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

// Получить рефералов пользователя (имена тех кто зарегистрировался по его ссылке)
app.get("/get-user-referrals", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email обязателен" 
      });
    }

    console.log('🔍 Получаем рефералов для пользователя:', email);

    // 1. Получаем данные пользователя
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error('❌ Пользователь не найден:', userError);
      return res.status(404).json({ 
        success: false, 
        error: "Пользователь не найден" 
      });
    }

    console.log('✅ Пользователь найден:', userData.email, 'Реферальный код:', userData.referral_code);

    // 2. Ищем всех пользователей которые зарегистрировались по его реферальному коду
    const { data: referrals, error: referralsError } = await supabase
      .from("users")
      .select("id, name, email, created_at, referral_code, level_1_referrals, level_2_referrals, level_3_referrals")
      .eq("referred_by", userData.referral_code)
      .order("created_at", { ascending: false });

    if (referralsError) {
      console.error('❌ Ошибка получения рефералов:', referralsError);
      return res.status(500).json({ 
        success: false, 
        error: "Ошибка получения рефералов" 
      });
    }

    console.log('📊 Найдено рефералов:', referrals?.length || 0);

    // 3. Группируем рефералов по уровням
    const level1Referrals = referrals || [];
    
    // Для 2 и 3 уровня нужно искать рефералов рефералов
    let level2Referrals = [];
    let level3Referrals = [];
    
    if (level1Referrals.length > 0) {
      // Получаем рефералов 2 уровня (рефералы рефералов 1 уровня)
      const level1Codes = level1Referrals.map(ref => ref.referral_code).filter(Boolean);
      
      if (level1Codes.length > 0) {
        const { data: level2Data } = await supabase
          .from("users")
          .select("id, name, email, created_at, referral_code, referred_by")
          .in("referred_by", level1Codes)
          .order("created_at", { ascending: false });
        
        level2Referrals = level2Data || [];
        
        // Получаем рефералов 3 уровня
        if (level2Referrals.length > 0) {
          const level2Codes = level2Referrals.map(ref => ref.referral_code).filter(Boolean);
          
          if (level2Codes.length > 0) {
            const { data: level3Data } = await supabase
              .from("users")
              .select("id, name, email, created_at, referral_code, referred_by")
              .in("referred_by", level2Codes)
              .order("created_at", { ascending: false });
            
            level3Referrals = level3Data || [];
          }
        }
      }
    }

    const result = {
      success: true,
      user: {
        email: userData.email,
        name: userData.name,
        referral_code: userData.referral_code,
        referral_link: userData.referral_link
      },
      referrals: {
        level_1: {
          count: level1Referrals.length,
          users: level1Referrals.map(ref => ({
            name: ref.name,
            email: ref.email,
            created_at: ref.created_at,
            level: 1
          }))
        },
        level_2: {
          count: level2Referrals.length,
          users: level2Referrals.map(ref => ({
            name: ref.name,
            email: ref.email,
            created_at: ref.created_at,
            level: 2
          }))
        },
        level_3: {
          count: level3Referrals.length,
          users: level3Referrals.map(ref => ({
            name: ref.name,
            email: ref.email,
            created_at: ref.created_at,
            level: 3
          }))
        }
      },
      message: "Referrals retrieved successfully"
    };

    console.log('🎉 Рефералы получены:', {
      level1: result.referrals.level_1.count,
      level2: result.referrals.level_2.count,
      level3: result.referrals.level_3.count
    });

    res.json(result);

  } catch (err) {
    console.error('❌ Ошибка в /get-user-referrals:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Failed to get user referrals"
    });
  }
});

// Endpoint для получения информации о том, кто пригласил пользователя
app.get("/get-referrer-info", async (req, res) => {
  try {
    const email = req.query.email;
    const browserId = req.query.browser_id;
    
    console.log('GET /get-referrer-info запрос:', { email, browserId });
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }
    
    // Получаем данные пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.log('❌ Пользователь не найден:', email);
      return res.json({
        success: true,
        user: { email },
        referrer: null,
        message: "User not found or no referrer"
      });
    }
    
    console.log('👤 Пользователь найден:', { email: userData.email, referred_by: userData.referred_by });
    
    // Если пользователь не был приглашен никем
    if (!userData.referred_by) {
      return res.json({
        success: true,
        user: {
          email: userData.email,
          name: userData.name,
          referral_code: userData.referral_code
        },
        referrer: null,
        message: "User was not referred by anyone"
      });
    }
    
    // Ищем того, кто пригласил пользователя (по referral_code)
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('email, name, referral_code, created_at')
      .eq('referral_code', userData.referred_by)
      .single();
    
    if (referrerError || !referrerData) {
      console.log('❌ Реферер не найден для кода:', userData.referred_by);
      return res.json({
        success: true,
        user: {
          email: userData.email,
          name: userData.name,
          referral_code: userData.referral_code
        },
        referrer: null,
        message: "Referrer not found"
      });
    }
    
    console.log('🎯 Реферер найден:', { email: referrerData.email, name: referrerData.name });
    
    const result = {
      success: true,
      user: {
        email: userData.email,
        name: userData.name,
        referral_code: userData.referral_code,
        referred_by: userData.referred_by
      },
      referrer: {
        email: referrerData.email,
        name: referrerData.name,
        referral_code: referrerData.referral_code,
        created_at: referrerData.created_at
      },
      message: "Referrer information retrieved successfully"
    };
    
    res.json(result);
    
  } catch (err) {
    console.error('❌ Ошибка в /get-referrer-info:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Failed to get referrer information"
    });
  }
});

// Временный endpoint для поиска пользователя по реферальному коду
app.get("/find-user-by-ref-code", async (req, res) => {
  try {
    const refCode = req.query.ref_code;
    
    if (!refCode) {
      return res.status(400).json({
        success: false,
        error: "ref_code is required"
      });
    }
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('email, name, referral_code, created_at')
      .eq('referral_code', refCode)
      .single();
    
    if (error || !userData) {
      return res.json({
        success: false,
        message: "User not found",
        ref_code: refCode
      });
    }
    
    res.json({
      success: true,
      user: userData,
      message: "User found"
    });
    
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// DEBUG endpoint для проверки сессий
app.get("/debug-sessions", (req, res) => {
  try {
    const browserId = req.query.browser_id;
    
    const debugInfo = {
      requestedBrowserId: browserId,
      sessionId: req.sessionID,
      sessionData: req.session,
      browserSessions: global.browserSessions ? Object.fromEntries(global.browserSessions) : {},
      authSessions: global.authSessions ? Object.fromEntries(global.authSessions) : {},
      hasBrowserSession: !!(global.browserSessions && browserId && global.browserSessions.has(browserId)),
      browserSessionData: (global.browserSessions && browserId && global.browserSessions.has(browserId)) 
        ? global.browserSessions.get(browserId) 
        : null
    };
    
    res.json({
      success: true,
      debug: debugInfo
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server запущен на порту " + (process.env.PORT || 3000));
});
