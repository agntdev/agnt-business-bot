import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "📅 Book time", data: "booking:start", order: 20 });

function backToMenu() {
  return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
}

const DATE_OPTIONS = [
  { label: "Today", data: "book:date:today" },
  { label: "Tomorrow", data: "book:date:tomorrow" },
  { label: "This week", data: "book:date:thisweek" },
];

const TIME_SLOTS = [
  { label: "9:00 AM", data: "book:slot:09:00" },
  { label: "11:00 AM", data: "book:slot:11:00" },
  { label: "1:00 PM", data: "book:slot:13:00" },
  { label: "3:00 PM", data: "book:slot:15:00" },
  { label: "5:00 PM", data: "book:slot:17:00" },
];

function dateKeyboard() {
  return inlineKeyboard([
    ...DATE_OPTIONS.map((o) => [inlineButton(o.label, o.data)]),
    [inlineButton("Cancel", "book:cancel")],
  ]);
}

function timeKeyboard() {
  return inlineKeyboard([
    ...TIME_SLOTS.map((o) => [inlineButton(o.label, o.data)]),
    [inlineButton("Back", "book:back:date")],
    [inlineButton("Cancel", "book:cancel")],
  ]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("booking:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_book_date";
  ctx.session.flowData = {};
  await ctx.reply("Pick a date for your booking:", { reply_markup: dateKeyboard() });
});

composer.callbackQuery(/^book:date:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "awaiting_book_date") return;
  const date = ctx.match[1];
  ctx.session.flowData = { ...ctx.session.flowData, date };
  ctx.session.step = "awaiting_book_time";
  await ctx.reply("Choose a time slot:", { reply_markup: timeKeyboard() });
});

composer.callbackQuery("book:back:date", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_book_date";
  await ctx.editMessageText("Pick a date for your booking:", { reply_markup: dateKeyboard() });
});

composer.callbackQuery(/^book:slot:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "awaiting_book_time") return;
  const slot = ctx.match[1];
  const data = ctx.session.flowData ?? {};
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  const date = data.date ?? "flexible";
  const confirmKb = inlineKeyboard([
    [inlineButton("✅ Confirm", `book:confirm:${date}:${slot}`)],
    [inlineButton("Cancel", "book:cancel")],
  ]);
  await ctx.editMessageText(`Booking: ${date} at ${slot}\n\nConfirm this slot?`, {
    reply_markup: confirmKb,
  });
});

composer.callbackQuery(/^book:confirm:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const parts = ctx.match[1].split(":");
  const date = parts[0] ?? "flexible";
  const time = parts[1] ?? "TBD";
  await ctx.editMessageText(
    `✅ Booking confirmed!\n\nDate: ${date}\nTime: ${time}\n\nWe'll see you then.`,
    { reply_markup: backToMenu() },
  );
});

composer.callbackQuery("book:cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.editMessageText("Booking cancelled.", { reply_markup: backToMenu() });
});

export default composer;
