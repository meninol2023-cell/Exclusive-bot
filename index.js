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
app.listen(process.env.PORT || 3000, () => {
  console.log('Web server ativo');
});

// 🔐 CONFIG
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// 🤖 CLIENT
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDOS
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abrir painel de atendimento')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// 🔁 REGISTRAR COMANDO GLOBAL
(async () => {
  try {
    console.log('Registrando comando...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('Comando registrado!');
  } catch (e) {
    console.error(e);
  }
})();

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

// 📂 CATEGORIA
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

// 📊 LOGS
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

// 🎯 INTERAÇÕES
client.on('interactionCreate', async interaction => {

  // 🎫 COMANDO /ticket
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ticket') {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Central de Atendimento")
        .setDescription("Escolha uma opção abaixo:")
        .setColor("Gold")

        // 🖼️ COLOCA SUA IMAGEM AQUI 👇
        .setImage("COLOCA_O_LINK_DA_IMAGEM_AQUI");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("parceria").setLabel("🤝 Parceria").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("duvida").setLabel("❓ Dúvidas").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("compras").setLabel("🛒 Compras").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("denuncia").setLabel("🚨 Denúncias").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("outros").setLabel("📁 Outros").setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // 🎟️ BOTÕES
  if (interaction.isButton()) {

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

    await interaction.reply({
      content: "✅ Ticket criado!",
      ephemeral: true
    });

    // 📊 LOG
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
  }

  // ❌ FECHAR TICKET
  if (interaction.isButton() && interaction.customId === "fechar_ticket") {

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
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
});

client.login(process.env.TOKEN).catch(console.error);
