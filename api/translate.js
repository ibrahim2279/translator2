export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { text, ru, check } = req.body || {};
  if (!text || typeof text !== "string" || text.length > 3000)
    return res.status(400).json({ error: "bad text" });

  let prompt;
  if (check) {
    prompt = `ترجم النص الروسي التالي إلى العربية ترجمة حرفية دقيقة قدر الإمكان (لأتأكد من معناه). أخرج الترجمة فقط بلا شرح.\n\n${text}`;
  } else if (ru) {
    prompt = `ترجم الرسالة الروسية التالية إلى العربية (بالعامية المصرية البسيطة المفهومة). حافظ على المعنى والنبرة. أخرج الترجمة فقط بلا شرح ولا علامات اقتباس.\n\n${text}`;
  } else {
    prompt = `Translate the following Arabic message into natural, everyday, informal Russian, as native speakers write to friends and acquaintances in casual messages.
Rules: use "ты" (not "Вы"), no formal or bureaucratic phrasing, no stiff greetings like "Здравствуйте" (use "Привет" etc.), keep the meaning and tone exactly. If the Arabic is colloquial (e.g. Egyptian), understand it in context.
Output ONLY the Russian translation, nothing else, no quotes.
On a new line after it, write "|||" followed by the Russian pronunciation written in Arabic letters.

Message:
${text}`;
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    );
    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: d?.error?.message || "api error" });
    const out = (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    if (!out) return res.status(500).json({ error: "empty" });
    res.status(200).json({ text: out });
  } catch (e) {
    res.status(500).json({ error: "server error" });
  }
}
