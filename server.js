import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Проверка сервера
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Webhook Tilda
app.post("/tilda-webhook", async (req, res) => {
  try {
    console.log("Получен POST /tilda-webhook");
    console.log("Тело запроса:", req.body);

    // Если тестовый запрос Tilda
    if (req.body.test) {
      console.log("Тестовый запрос от Tilda");
      return res.status(200).json({ success: true });
    }

    const { email } = req.body;

    if (!email) {
      console.log("Ошибка: email отсутствует");
      return res.status(400).json({ error: "Email обязателен" });
    }

    // Добавляем или обновляем пользователя по email
    // name указываем дефолтно, чтобы не было ошибки NOT NULL
    const { data, error } = await supabase
      .from("users")
      .upsert([{ email, name: email }], { onConflict: "email" });

    if (error) throw error;

    console.log("Webhook успешно обработан, данные пользователя:", data);
    res.json({ success: true, user: data });
  } catch (err) {
    console.error("Ошибка webhook:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Получение пользователя по email
app.get("/get-user", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email обязателен" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server запущен на порту " + (process.env.PORT || 3000));
});
