require("./web/server");

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// carregar comandos
const commandFiles = fs.readdirSync("./commands");
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// carregar evento
require("./events/interactionCreate")(client);

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
