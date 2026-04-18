const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = {
  name: "painel",

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("🎫 Exclusive • Central de Atendimento")
      .setDescription(`
Bem-vindo à **Exclusive**!

Selecione uma categoria abaixo para abrir seu ticket e falar com nossa equipe.

━━━━━━━━━━━━━━━━━━

📌 **Regras rápidas:**
• Não abra tickets sem necessidade  
• Evite spam ou múltiplos tickets  
• Seja claro ao explicar seu problema  

━━━━━━━━━━━━━━━━━━

⏳ **Atendimento:** o mais rápido possível
`)
      .setImage(process.env.IMAGEM)
      .setColor("#6a0dad")
      .setFooter({ text: "Exclusive • Suporte Oficial" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("duvidas")
        .setLabel("Dúvidas")
        .setEmoji("❓")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("compras")
        .setLabel("Compras")
        .setEmoji("💰")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("denuncias")
        .setLabel("Denúncias")
        .setEmoji("🚨")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("parceria")
        .setLabel("Parceria")
        .setEmoji("🤝")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("outros")
        .setLabel("Outros")
        .setEmoji("📂")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
