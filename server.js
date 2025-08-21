import express from "express";
import cors from "cors"; // <-- подключаем cors
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Разрешаем CORS для домена Tilda
app.use(cors({
  origin: "https://aida.kg", // указываем домен вашего сайта
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

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
