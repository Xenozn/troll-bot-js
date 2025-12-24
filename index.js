const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, prefix } = require('./config.json');
const play = require('play-dl'); // ← AJOUTER

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// Charger les commandes
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('clientReady', async () => {
    console.log(`${client.user.tag} est connecté !`);

    // ← AJOUTER CES LIGNES
    try {
        await play.setToken({
            youtube: {
                cookie: await play.getFreeClientID()
            }
        });
        console.log('✅ Play-dl initialisé');
    } catch (err) {
        console.error('❌ Erreur play-dl:', err);
    }
});

client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Erreur lors de l\'exécution de la commande.');
    }
});

client.login(token);