require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Embed } = require('discord.js');
const { title } = require('node:process');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]});

client.on('ready', () => {
    console.log(`Your bot has booted up! ${client.user.tag}`)
    client.user.setPresence({ status : 'online'});
});


// MESSAGE DELETION

client.on('messageDelete', message => {
    const channel = message.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');

    if(!channel) return;

    const embed = new EmbedBuilder()
    .setTitle('✍️ A Message was deleted.')
    .setDescription(`**Author** : ${message.author.username} \n**Message** : ${message.content}`)
    .setColor('#9300A3')
    .setFooter({ text : `*The Keen Keeper has recorded it.*`})

    channel.send({ embeds: [embed] });
});

// MEMBER KICKING
client.on('guildMemberRemove', async member => {
    const channel = member.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
    if (!channel) return;

    const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
    const kickLog = auditLogs.entries.first();

    let title = '👢 A Member left the server';
    let description = `**Member** : ${member.user.username}`;

    if (kickLog && kickLog.target.id === member.user.id) {
        title = `👢 ${member.user.username} was KICKED by ${kickLog.executor.username}`;
        description += `\n**Kicked by** : ${kickLog.executor.username}`;
        description += `\n**Reason** : ${kickLog.reason || 'No reason provided'}`;
    }

    const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('#FF2908')
    .setFooter({ text: `*The Keen Keeper has recorded it.*` })
    .setTimestamp()

    channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);