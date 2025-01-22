import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });
const serverUrl = `${process.env.SERVER_URL}/upload-pdf`;

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Сервер работает на порту ${port}`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.document) {
    const fileId = msg.document.file_id;

    try {
      const fileLink = await bot.getFileLink(fileId);

      bot.sendMessage(chatId, 'Жақсы, кішкене күте тұрыңызшы!');

      const response = await fetch(fileLink);
      const buffer = await response.buffer();

      const form = new FormData();
      form.append('pdfFile', buffer, 'file.pdf');

      const serverResponse = await fetch(serverUrl, {
        method: 'POST',
        body: form,
      });

      const serverData = await serverResponse.json();
      let { "Пополнение саны": depositCount, "Адамдар": senders, "Адамдар саны": sendersCount } = serverData;

      const excludedKeywords = ["Kaspi Депозита", "С карты другого банка", "В Kaspi Банкомате"];
      senders = senders.filter(sender => !excludedKeywords.some(keyword => sender.includes(keyword)));

      sendersCount = senders.length;

      bot.sendMessage(chatId, `Пополнение саны: ${depositCount}\n` +
        `Адамдар: ${senders.join(', ')}\n` +
        `Адамдар саны: ${sendersCount}`);
    } catch (error) {
      bot.sendMessage(chatId, 'Произошла ошибка при обработке файла.');
      console.error('Ошибка при обработке файла:', error);
    }
  } else {
    bot.sendMessage(chatId, 'Сәлеметсіз бе, PDF файлыңызды жіберіңіз!');
  }
});

console.log('Бот успешно запущен и готов принимать сообщения!');