import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";

registerMainMenuItem({ label: "🛒 Place order", data: "order:start", order: 30 });

function backToMenu() {
  return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
}

const ITEM_OPTIONS = [
  { label: "📱 Basic plan", data: "order:item:basic" },
  { label: "⭐ Premium plan", data: "order:item:premium" },
  { label: "🏢 Enterprise plan", data: "order:item:enterprise" },
];

function itemKeyboard() {
  return inlineKeyboard([
    ...ITEM_OPTIONS.map((o) => [inlineButton(o.label, o.data)]),
    [inlineButton("Cancel", "order:cancel")],
  ]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("order:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_order_item";
  ctx.session.flowData = {};
  await ctx.reply("Choose a plan:", { reply_markup: itemKeyboard() });
});

composer.callbackQuery(/^order:item:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.session.step !== "awaiting_order_item") return;
  const item = ctx.match[1];
  ctx.session.flowData = { ...ctx.session.flowData, item };
  ctx.session.step = "awaiting_order_delivery";
  await ctx.reply("Where should we send it? Share your delivery address.", {
    reply_markup: { force_reply: true, input_field_placeholder: "Delivery address…" },
  });
});

composer.callbackQuery("order:cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  await ctx.editMessageText("Order cancelled.", { reply_markup: backToMenu() });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_order_delivery") return next();
  const address = ctx.message.text.trim();
  if (address.length < 3) {
    await ctx.reply("Please provide a valid delivery address.");
    return;
  }
  const data = ctx.session.flowData ?? {};
  const item = data.item ?? "basic";
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  const confirmKb = inlineKeyboard([
    [inlineButton("✅ Confirm order", `order:confirm:${item}`)],
    [inlineButton("Cancel", "order:cancel")],
  ]);
  await ctx.reply(
    `Order summary:\n\nPlan: ${item}\nAddress: ${address}\n\nTap confirm to place your order.`,
    { reply_markup: confirmKb },
  );
});

composer.callbackQuery(/^order:confirm:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const item = ctx.match[1];
  await ctx.editMessageText(
    `✅ Order placed!\n\nPlan: ${item}\n\nYou'll receive a confirmation shortly.`,
    { reply_markup: backToMenu() },
  );
});

export default composer;
