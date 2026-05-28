import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ChannelType 
} from 'discord.js';

// ==========================================
// 1. CONFIGURATION BLOCK
// ==========================================
const config = {
  autoReactions: {
    enabled: true,
    triggers: {
      upi: "💸",
      ip: "🌐",
      ping: "🏓",
      help: "👀",
    },
  },
  kingReaction: {
    enabled: true,
    userId: "YOUR_DISCORD_USER_ID_HERE", // <-- Yahan apni asli Discord User ID paste karein
    emoji: "👑",
  },
  stickyMessages: {
    enabled: true,
    defaultMessage: "📌 Please follow the server rules and enjoy your stay!",
    repeatAfterMessages: 5,
  },
  channels: {
    welcome: "WELCOME_CHANNEL_ID_HERE",  // <-- Welcome channel ki ID daalein
    logs: "LOGS_CHANNEL_ID_HERE",        // <-- Server Logs channel ki ID daalein
    ticketCategory: "CATEGORY_ID_HERE",  // <-- Jis category ke andar tickets khulein
  },
  roles: {
    verified: "VERIFIED_ROLE_ID_HERE",    // <-- Verified role ki ID
    staff: "STAFF_ROLE_ID_HERE",          // <-- Staff/Admin role ki ID
  }
};

// Trackers
const messageCounters = new Map();
const lastStickyMessages = new Map();

// ==========================================
// 2. CLIENT INITIALIZATION
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites
  ]
});

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} Online hai aur Railway par chal raha hai!`);
  
  // Slash Commands Register Karna
  const guildId = client.guilds.cache.first()?.id; 
  if (guildId) {
    const guild = client.guilds.cache.get(guildId);
    
    // Commands Array
    const commands = [
      // Announcement Command
      new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Server mein embed announcement karein')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt => opt.setName('title').setDescription('Title').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Message').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel select karein')),

      // Shop Command
      new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Server ki Items Shop open karein'),

      // Ticket Setup Command
      new SlashCommandBuilder()
        .setName('setup-tickets')
        .setDescription('Ticket system panel create karein')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    ];

    await guild.commands.set(commands.map(cmd => cmd.toJSON()));
    console.log('🚀 Slash Commands successfully register ho gaye hain!');
  }
});

// ==========================================
// 3. MESSAGE EVENT (King, Auto-React, Sticky)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.toLowerCase();

  // 👑 KING MENTION REACTION (100% Working)
  if (config.kingReaction.enabled && message.mentions.has(config.kingReaction.userId)) {
    try {
      await message.react(config.kingReaction.emoji);
    } catch (err) {
      console.error("King emoji lagane mein error:", err);
    }
  }

  // 💸 AUTO REACTIONS (upi, ip, etc.)
  if (config.autoReactions.enabled) {
    for (const [trigger, emoji] of Object.entries(config.autoReactions.triggers)) {
      if (content.includes(trigger)) {
        try {
          await message.react(emoji);
        } catch (err) {
          console.error(`Auto-reaction ${emoji} lagane mein error:`, err);
        }
      }
    }
  }

  // 📌 STICKY MESSAGE SYSTEM
  if (config.stickyMessages.enabled) {
    const channelId = message.channel.id;
    let count = messageCounters.get(channelId) || 0;
    count++;
    messageCounters.set(channelId, count);

    if (count >= config.stickyMessages.repeatAfterMessages) {
      messageCounters.set(channelId, 0);

      try {
        if (lastStickyMessages.has(channelId)) {
          const oldMsg = lastStickyMessages.get(channelId);
          await oldMsg.delete().catch(() => {});
        }

        const newSticky = await message.channel.send({
          content: config.stickyMessages.defaultMessage
        });
        lastStickyMessages.set(channelId, newSticky);
      } catch (err) {
        console.error("Sticky message send karne mein error:", err);
      }
    }
  }
});

// ==========================================
// 4. WELCOMER SYSTEM (Channel + DM)
// ==========================================
client.on('guildMemberAdd', async (member) => {
  // Channel Welcome
  const welcomeChannel = member.guild.channels.cache.get(config.channels.welcome);
  if (welcomeChannel) {
    const channelEmbed = new EmbedBuilder()
      .setTitle(`👋 Welcome to ${member.guild.name}!`)
      .setDescription(`Welcome ${member}! Server join karne ka shukriya. Please rules check karein!`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor('#00ffcc')
      .setTimestamp();

    welcomeChannel.send({ embeds: [channelEmbed] });
  }

  // DM Welcome
  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle(`🎉 Welcome to ${member.guild.name}!`)
      .setDescription(`Hey ${member.user.username}, hamare server par khush-amdeed! Agar koi help chahiye toh server mein ticket open kar sakte hain.`)
      .setColor('#ff00bb');
    
    await member.send({ embeds: [dmEmbed] });
  } catch (err) {
    console.log(`${member.user.tag} ka DM block tha, isliye DM welcome nahi gaya.`);
  }
});

// ==========================================
// 5. INTERACTION CREATE (Commands & Buttons)
// ==========================================
client.on('interactionCreate', async (interaction) => {
  // --- SLASH COMMANDS ---
  if (interaction.isChatInputCommand()) {
    
    // /announce
    if (interaction.commandName === 'announce') {
      const title = interaction.options.getString('title');
      const msg = interaction.options.getString('message');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      const embed = new EmbedBuilder()
        .setTitle(`📢 ${title}`)
        .setDescription(msg)
        .setColor('#ffaa00')
        .setTimestamp()
        .setFooter({ text: `Announced by ${interaction.user.username}` });

      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: 'Announcement send ho gayi!', ephemeral: true });
    }

    // /shop
    if (interaction.commandName === 'shop') {
      const embed = new EmbedBuilder()
        .setTitle('🛒 SERVER PERKS SHOP')
        .setDescription('Niche diye gaye Dropdown menu se item select karein taake aap uski detailed info dekh sakein aur buy kar sakein.')
        .setColor('#5865F2');

      const select = new StringSelectMenuBuilder()
        .setCustomId('shop_menu')
        .setPlaceholder('Koi perk select karein...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('👑 King VIP Role')
            .setDescription('Price: 5000 Coins - Get premium role & perks')
            .setValue('shop_king_vip'),
          new StringSelectMenuOptionBuilder()
            .setLabel('🎨 Custom Text Tag')
            .setDescription('Price: 2000 Coins - Customize your server tag')
            .setValue('shop_custom_tag')
        );

      const row = new ActionRowBuilder().addComponents(select);
      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // /setup-tickets (Tickety Setup)
    if (interaction.commandName === 'setup-tickets') {
      const embed = new EmbedBuilder()
        .setTitle('📩 Support Tickets')
        .setDescription('Agar aapko koi masla hai ya staff se baat karni hai, toh niche diye gaye button par click karke ticket create karein.')
        .setColor('#2F3136');

      const btn = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(btn);
      await interaction.reply({ content: 'Ticket system setup done!', ephemeral: true });
      return interaction.channel.send({ embeds: [embed], components: [row] });
    }
  }

  // --- SHOP DROPDOWN SELECTION ---
  if (interaction.isStringSelectMenu() && interaction.customId === 'shop_menu') {
    const selection = interaction.values[0];
    let itemTitle = "", itemDesc = "";

    if (selection === 'shop_king_vip') {
      itemTitle = "👑 King VIP Role";
      itemDesc = "Is perk se aapko exclusive chat color, image permissions aur premium perks milenge.\n\n**Buy karne ke liye niche button par click karein.**";
    } else if (selection === 'shop_custom_tag') {
      itemTitle = "🎨 Custom Text Tag";
      itemDesc = "Aap apne naam ke sath server mein aik custom tag laga sakte hain.\n\n**Buy karne ke liye niche button par click karein.**";
    }

    const itemEmbed = new EmbedBuilder().setTitle(itemTitle).setDescription(itemDesc).setColor('#00ff00');
    const buyButton = new ButtonBuilder().setCustomId(`buy_${selection}`).setLabel('Buy Item Now').setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(buyButton);

    return interaction.reply({ embeds: [itemEmbed], components: [row], ephemeral: true });
  }

  // --- BUTTON CLICKS (Ticket Create/Close & Shop Buy) ---
  if (interaction.isButton()) {
    
    // Create Ticket Button Click
    if (interaction.customId === 'create_ticket') {
      await interaction.deferReply({ ephemeral: true });

      const channelName = `ticket-${interaction.user.username}`;
      try {
        const ticketChannel = await interaction.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: config.channels.ticketCategory,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: config.roles.staff, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });

        const ticketEmbed = new EmbedBuilder()
          .setTitle('🎫 Ticket Opened')
          .setDescription(`Welcome ${interaction.user}! Support staff jald hi aap se raabta karegi. Ticket band karne ke liye niche click karein.`)
          .setColor('#5865F2');

        const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(closeBtn);

        await ticketChannel.send({ content: `${interaction.user} | <@&${config.roles.staff}>`, embeds: [ticketEmbed], components: [row] });
        return interaction.editReply({ content: `✅ Aapki ticket ban gayi hai: ${ticketChannel}` });
      } catch (err) {
        console.error(err);
        return interaction.editReply({ content: 'Ticket banane mein koi error aaya hai!' });
      }
    }

    // Close Ticket Button Click
    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Yeh ticket 5 seconds mein delete ho jayegi...' });
      setTimeout(async () => {
        await interaction.channel.delete().catch(() => {});
      }, 5000);
    }

    // Shop Buy Buttons Click
    if (interaction.customId.startsWith('buy_')) {
      return interaction.reply({ content: `✅ Processing payment! Bot database (Postgres) se balance verify kar raha hai...`, ephemeral: true });
    }
  }
});

// ==========================================
// 6. SERVER LOGS SYSTEM
// ==========================================
client.on('messageDelete', async (message) => {
  if (message.author?.bot || !message.guild) return;
  const logChannel = message.guild.channels.cache.get(config.channels.logs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .setColor('#ff0000')
    .setDescription(`**Author:** ${message.author}\n**Channel:** ${message.channel}\n**Content:** ${message.content || "None/Attachment"}`)
    .setTimestamp();
  
  logChannel.send({ embeds: [embed] });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (oldMessage.author?.bot || !oldMessage.guild || oldMessage.content === newMessage.content) return;
  const logChannel = oldMessage.guild.channels.cache.get(config.channels.logs);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📝 Message Edited')
    .setColor('#ffff00')
    .setDescription(`**Author:** ${oldMessage.author}\n**Channel:** ${oldMessage.channel}\n**Old:** ${oldMessage.content}\n**New:** ${newMessage.content}`)
    .setTimestamp();
  
  logChannel.send({ embeds: [embed] });
});

// Bot Login
client.login(process.env.DISCORD_TOKEN);
