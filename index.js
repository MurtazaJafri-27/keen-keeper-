const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]});

client.on('ready', () => {
    console.log(`Your bot has booted up! ${client.user.tag}`)
    client.user.setPresence({ status : 'online'})
});

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

client.login(process.env.TOKEN);