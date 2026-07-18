import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "📋 Request service", data: "request:service", order: 10 });

const SERVICE_OPTIONS = [
  { label: "🔧 Repair", data: "req:svc:repair" },
  { label: "🧹 Cleaning", data: "req:svc:cleaning" },
  { label: "📦 Delivery", data: "req:svc:delivery" },
  { label: "💬 Consultation", data: "req:svc:consultation" },
];

const TIME_OPTIONS = [
  { label: "🌅 Morning", data: "req:time:morning" },
  { label: "☀️ Afternoon", data: "req:time:afternoon" },
  { label: "🌙 Evening", data: "req:time:evening" },
];

function serviceKeyboard() {
  return inlineKeyboard(SERVICE_OPTIONS.map((o) => [inlineButton(o.label, o.data)]));
}

function timeKeyboard() {
  return inlineKeyboard([
    ...TIME_OPTIONS.map((o) => [inlineButton(o.label, o.data)]),
    [inlineButton("Cancel", "req:cancel")],
  ]);
}

function backToMenu() {
  return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("request:service", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_service_type";
  ctx.session.flowData = {};
  await ctx.reply("What do you need help with?", { reply_markup: serviceKeyboard() });
});

composer.callbackQuery(/^req:svc:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "awaiting_service_type") return;
  const service = ctx.match[1];
  ctx.session.flowData = { ...ctx.session.flowData, service };
  ctx.session.step = "awaiting_service_time";
  await ctx.reply("When do you need it?", { reply_markup: timeKeyboard() });
});

composer.callbackQuery(/^req:time:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "awaiting_service_time") return;
  const time = ctx.match[1];
  ctx.session.flowData = { ...ctx.session.flowData, time };
  ctx.session.step = "awaiting_service_contact";
  await ctx.reply("How can we reach you? Share your phone number or email.", {
    reply_markup: { force_reply: true, input_field_placeholder: "Phone or email…" },
  });
});

composer.callbackQuery("req:cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.editMessageText("Request cancelled.", { reply_markup: backToMenu() });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_service_contact") return next();
  const contact = ctx.message.text.trim();
  if (contact.length < 3) {
    await ctx.reply("Please provide a valid phone number or email address.");
    return;
  }
  const data = ctx.session.flowData ?? {};
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  const service = data.service ?? "general";
  const time = data.time ?? "flexible";
  const lines = [
    "✅ Request received!",
    "",
    `Service: ${service}`,
    `When: ${time}`,
    `Contact: ${contact}`,
    "",
    "We'll get back to you shortly.",
  ];
  await ctx.reply(lines.join("\n"), { reply_markup: backToMenu() });
});

export default composer;
