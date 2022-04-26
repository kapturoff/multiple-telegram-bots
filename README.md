# multiple-telegram-bots
A prototype project to present running multiple Telegram Bots on an one machine

Run multiple Telegram Bots on an one machine. Each of the bots will be serving only its own city and they will use only one connection to a database.

## How to run it?
If you don't have any dedicated server or white IP to publish your port to the Internet, you can use things like 
[ngrok](https://github.com/inconshreveable/ngrok/blob/master/docs/DEVELOPMENT.md) or [localtunnel](http://localtunnel.github.io/www/) to expose your ports. It will 
come in handy when you will be setting webhooks for Telegram API.

Also, you can get bot tokens or even create new bots via [Bot Father](http://t.me/BotFather).
1. Install dependencies
```
> npm install
```
2. Fill the `.example.env` file with your data and rename it to `.env`. _**Important:** WEBHOOK_URL must end with "/" symbol!_
3. Fill the database by running:
```
> npm run fill_db
```
4. Compile Typescript into Javascript using:
```
> npm run build
```
5. Run the server and wait until it says "server's now listening"
```
> npm run start
```
6. Message your bots!
