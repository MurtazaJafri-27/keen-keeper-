require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Embed } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration]});

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
    .setFooter({ text : `The Keen Keeper has recorded it.`})

    channel.send({ embeds: [embed] });
});

// MEMBER KICKING
client.on('guildMemberRemove', async member => {
    try {
        const channel = member.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
        if (!channel) {
            console.log('Channel not found');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
        const kickLog = auditLogs.entries.first();
        console.log('kickLog:', kickLog);

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
        .setFooter({ text: `The Keen Keeper has recorded it.` })
        .setTimestamp()

        channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error:', error);
    }
});

client.on('guildBanAdd', async ban => { // 'ban' is a GuildBan object
    try {
        // 1. Find the log channel
        const channel = ban.guild.channels.cache.find(ch => ch.name === 'keen-keepers-logs');
        if (!channel) return;

        // 2. Wait 1 second for the Audit Log to catch up
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Fetch the latest ban log (Type 22 is MEMBER_BAN_ADD)
        const fetchedLogs = await ban.guild.fetchAuditLogs({
            limit: 1,
            type: 22, 
        });

        const banLog = fetchedLogs.entries.first();
        
        let title = `🚫 A User was banned.`;
        let description = `No reason provided.`;

        // 4. Verify the log matches the user being banned
        if (banLog && banLog.target.id === ban.user.id) {
            const { executor, reason } = banLog;
            title = `🚫 ${ban.user.username} was BANNED`;
            description = `**User:** ${ban.user.tag}\n**By:** ${executor.username}\n**Reason:** ${reason || "No particular reason given."}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor('#A80000')
            .setFooter({ text: `Keen Keeper has recorded it.` }) 
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Ban Log Error:', error);
    }
});
client.login(process.env.TOKEN);