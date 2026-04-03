require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, Partials, ActivityType } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember] 
});

const messageCounts = new Map();

client.on('ready', () => {
    console.log(`Your bot has booted up! ${client.user.tag}`);
    client.user.setActivity('Recording Deeds' , { type : ActivityType.Watching});
});

// HELP

client.on('messageCreate', async message => {
    const channel = message.channel;

    if(message.content === 'kk help'){
        const embed = new EmbedBuilder()
        .setTitle(`🤝 KEEN KEEPER HEARS YOU! ❓`)
        .setDescription(`What do you need help with? \n\n
            **kk level** : Shows your current level based on how many attachments you've sent.
            [only records them in keepers library] \n
            \t\t**[STAFF ONLY]**
            **kk lastkick** : Shows the last person kicked and who kicked them. \n
            **kk lastban** : Shows the last person banned and who banned them.
            `)
        .setColor('#8B27F5')
        .setFooter({ text : 'Fret not.'})

        channel.send({ embeds : [embed]});
    }
});

// MESSAGE DELETION
client.on('messageDelete', async message => {
    if (message.partial) {
        try { await message.fetch(); } catch (e) { return; }
    }
    const channel = message.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle('✍️ A Message was deleted.')
        .setDescription(`**Author** : ${message.author?.username || "Unknown"} \n**Message** : ${message.content || "No content"}`)
        .setColor('#9300A3')
        .setFooter({ text: `The Keen Keeper has recorded it.` });

    channel.send({ embeds: [embed] });
});

// MESSAGE TRACKING & LEVELING
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // 1. Define the specific channel where media counts
    const libraryChannel = message.guild.channels.cache.find(ch => ch.name === '📸︱keepers-library');
    if (!libraryChannel) return;

    // 2. Only run the counter if the message is in THAT channel AND has a file/image
    if (message.channel.id === libraryChannel.id && message.attachments.size > 0) {
        
        const id = message.author.id;
        let currentCounts = messageCounts.get(id) || 0;
        currentCounts++;
        messageCounts.set(id, currentCounts);

        let level = 0;
        if (currentCounts >= 5) level = 1;
        if(currentCounts >= 10) level = 2;

        // Level Up Alert
        if (currentCounts === 5) {
            const levelEmbed = new EmbedBuilder()
                .setTitle(`📈 ${message.author.username} leveled up to level ${level}`)
                .setDescription(`Congrats! You can now enter 4-player private voice chats **[The Primordian Retreat]**⏫`)
                .setColor('#0AEBFF')
                .setFooter({ text: 'Your work inspires me...' });

            libraryChannel.send({ embeds: [levelEmbed] });
            const role1 = message.guild.roles.cache.find(r => r.name === '1');
            message.member.roles.add(role1);
        }
        if (currentCounts === 10) {
            const levelEmbed = new EmbedBuilder()
                .setTitle(`📈 ${message.author.username} leveled up to level ${level}`)
                .setDescription(`You can now send media in **the Veil*** ⏫`)
                .setColor('#0AEBFF')
                .setFooter({ text: 'Your work inspires me...' });

            libraryChannel.send({ embeds: [levelEmbed] });
            const role2 = message.guild.roles.cache.find(r => r.name === '2');
            message.member.roles.add(role2);
        }
    }

    // 3. Keep the level check command working anywhere (or only in specific channels)
    if (message.content === 'kk level') {
        const id = message.author.id;
        const currentCounts = messageCounts.get(id) || 0;
        let level = 0;
        if(currentCounts >= 5){
            level = 1;
        }
        else if(currentCounts >= 10){
            level = 2;
        }

        const checkLevel = new EmbedBuilder()
            .setTitle(`Username : ***${message.author.username}***`)
            .setDescription(`Level : ${level}\nMedia Sent: ${currentCounts}`)
            .setColor('#0AEBFF');

        message.channel.send({ embeds: [checkLevel] });
    }
});
// KICKING
client.on('guildMemberRemove', async member => {
    try {
        const channel = member.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
        if (!channel) return;

        await new Promise(resolve => setTimeout(resolve, 2000));
        const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
        const kickLog = auditLogs.entries.first();

        let title = '👢 A Member left the server';
        let description = `**Member** : ${member.user.username}`;

        if (kickLog && kickLog.target.id === member.user.id) {
            title = `👢 ${member.user.username} was KICKED by ${kickLog.executor.username}`;
            description += `\n**Reason** : ${kickLog.reason || 'No reason provided'}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#FF2908')
            .setFooter({ text: `The Keen Keeper has recorded it.` })
            .setTimestamp();

        channel.send({ embeds: [embed] });
    } catch (error) { console.error(error); }
});

// BANNING
client.on('guildBanAdd', async ban => {
    try {
        const channel = ban.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
        if (!channel) return;

        await new Promise(resolve => setTimeout(resolve, 2000));
        const fetchedLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: 22 });
        const banLog = fetchedLogs.entries.first();
        
        let title = `🚫 A User was banned.`;
        let description = `**User:** ${ban.user.tag}`;

        if (banLog && banLog.target.id === ban.user.id) {
            title = `🚫 ${ban.user.username} was BANNED by ${banLog.executor.username}`;
            description += `\n**Reason:** ${banLog.reason || "No particular reason given."}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setThumbnail('https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndXhieHptbW56bmRiaHpxbmZxeHptbW56bmRiaHpxbmZxeHptJmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/fe3NDdz8WPAcnIIIFM/giphy.gif')
            .setColor('#A80000')
            .setFooter({ text: `Keen Keeper has recorded it.` }) 
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (error) { console.error(error); }
});

// LAST KICK

client.on('messageCreate', async message => {
      if(message.content === 'kk lastkick'){
          const auditLogs = await message.guild.fetchAuditLogs({ type : 20, limit : 1});
          const kickLogs = await auditLogs.entries.first();

          message.reply(`Last User Kicked : **${kickLogs.target.username}** \n By : **${kickLogs.executor.username}**`);
      }
})

// LAST BAN

client.on('messageCreate', async message => {
      if(message.content === 'kk lastban'){
          const auditLogs = await message.guild.fetchAuditLogs({ type : 22, limit : 1});
          const banLogs = await auditLogs.entries.first();

          message.reply(`Last User Banned : **${banLogs.target.username}** \n By : **${banLogs.executor.username}**`);
      }
})

client.login(process.env.TOKEN);