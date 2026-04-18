require("./web.js");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE = process.env.STAFF_ROLE;
const IMAGEM = process.env.IMAGEM;

// Registrar comando /painel automaticamente
const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Enviar painel de tickets")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Comando registrado!");
  } catch (err) {
    console.error(err);
  }
})();

client.once("ready", () => {
  console.log(`Logado como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "painel") {

      const embed = new EmbedBuilder()
        .setTitle("🎫 Sistema de Tickets")
        .setDescription("Selecione uma opção abaixo.")
        .setImage(IMAGEM)
        .setColor("Purple");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Escolha uma opção")
        .addOptions([
          { label: "Dúvidas", value: "duvidas" },
          { label: "Compras", value: "compras" },
          { label: "Denúncias", value: "denuncias" },
          { label: "Parceria", value: "parceria" },
          { label: "Outros", value: "outros" }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "ticket_menu") {

      const tipo = interaction.values[0];
      const guild = interaction.guild;
      const user = interaction.user;

      // Verificar se já tem ticket
      const existente = guild.channels.cache.find(c => c.name === `ticket-${user.username}`);
      if (existente) {
        return interaction.reply({
          content: "Você já tem um ticket aberto!",
          ephemeral: true
        });
      }

      const categoria = await guild.channels.create({
        name: `Tickets - ${user.username}`,
        type: ChannelType.GuildCategory
      });

      const canal = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: categoria.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: user.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: STAFF_ROLE,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      await canal.send(`🎫 Ticket de <@${user.id}> | Tipo: **${tipo}**`);

      await interaction.reply({
        content: `Ticket criado: ${canal}`,
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);
