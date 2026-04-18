const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const express = require('express');
const app = express();

// 🌐 KEEP ALIVE
app.get('/', (req, res) => res.send('Bot online'));
app.listen(3000, () => console.log('Web server ativo'));

// ⚠️ CONFIG
const TOKEN = "SEU_TOKEN_AQUI";
const CLIENT_ID = "ID_DO_SEU_BOT";

// 🤖 CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO GLOBAL
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abrir painel de atendimento')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// REGISTRO GLOBAL
(async () => {
  try {
    console.log('Registrando comando global...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('Comando global registrado!');
  } catch (e) {
    console.error(e);
  }
})();

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

// 🔎 FUNÇÃO PRA PEGAR OU CRIAR CATEGORIA
async function getCategoria(guild) {
  let categoria = guild.channels.cache.find(c => c.name === "tickets");

  if (!categoria) {
    categoria = await guild.channels.create({
      name: "tickets",
      type: ChannelType.GuildCategory
    });
  }

  return categoria;
}

// 🔎 FUNÇÃO PRA PEGAR OU CRIAR LOGS
async function getLogs(guild) {
  let canal = guild.channels.cache.find(c => c.name === "logs-tickets");

  if (!canal) {
    canal = await guild.channels.create({
      name: "logs-tickets",
      type: ChannelType.GuildText
    });
  }

  return canal;
}

// 🎫 COMANDO
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ticket') {

    const embed = new EmbedBuilder()
      .setTitle("🎫 Central de Atendimento")
      .setDescription("Escolha uma opção abaixo:")
      .setColor("Gold");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("parceria").setLabel("🤝 Parceria").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("duvida").setLabel("❓ Dúvidas").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("compras").setLabel("🛒 Compras").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("denuncia").setLabel("🚨 Denúncias").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("outros").setLabel("📁 Outros").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

// 📂 CRIAR TICKET
client.on('interactionCreate', async interaction => {

  if (!interaction.isButton()) return;

  const tipos = {
    parceria: "🤝 Parceria",
    duvida: "❓ Dúvidas",
    compras: "🛒 Compras",
    denuncia: "🚨 Denúncias",
    outros: "📁 Outros"
  };

  const tipo = tipos[interaction.customId];
  if (!tipo) return;

  const categoria = await getCategoria(interaction.guild);
  const logs = await getLogs(interaction.guild);

  const canal = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: categoria.id,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  const fecharBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fechar_ticket")
      .setLabel("❌ Fechar Ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await canal.send({
    content: `🎫 ${interaction.user} abriu um ticket (${tipo})`,
    components: [fecharBtn]
  });

  await interaction.reply({ content: "✅ Ticket criado!", ephemeral: true });

  // 📊 LOG CRIAÇÃO
  const embedLog = new EmbedBuilder()
    .setTitle("📊 Ticket Criado")
    .addFields(
      { name: "Usuário", value: interaction.user.tag, inline: true },
      { name: "Tipo", value: tipo, inline: true },
      { name: "Canal", value: `${canal}`, inline: true }
    )
    .setColor("Green")
    .setTimestamp();

  logs.send({ embeds: [embedLog] });
});

// ❌ FECHAR
client.on('interactionCreate', async interaction => {

  if (!interaction.isButton()) return;

  if (interaction.customId === "fechar_ticket") {

    const logs = await getLogs(interaction.guild);

    const embedLog = new EmbedBuilder()
      .setTitle("📊 Ticket Fechado")
      .addFields(
        { name: "Canal", value: interaction.channel.name, inline: true },
        { name: "Fechado por", value: interaction.user.tag, inline: true }
      )
      .setColor("Red")
      .setTimestamp();

    logs.send({ embeds: [embedLog] });

    await interaction.reply({
      content: "❌ Fechando em 5 segundos...",
      ephemeral: true
    });

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000);
  }
});

client.login(TOKEN);
