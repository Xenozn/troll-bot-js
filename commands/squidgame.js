const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection
} = require('@discordjs/voice');
const path = require('path');
const config = require('../config.json');

// Map pour stocker les cooldowns par serveur
const cooldowns = new Map();

module.exports = {
    name: 'squidgame',
    description: 'Squid Game - Usage: !squidgame ou !squidgame <ID_salon>',
    async execute(message, args) {

        // Vérifier si l'utilisateur a le rôle requis
        const requiredRoleId = config.squidgame.requiredRoleId;

        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande !");
        }

        // Vérifier le cooldown
        const guildId = message.guild.id;
        const cooldownTime = config.squidgame.cooldown * 1000; // Convertir en millisecondes

        if (cooldowns.has(guildId)) {
            const lastUsed = cooldowns.get(guildId);
            const timePassed = Date.now() - lastUsed;
            const timeLeft = cooldownTime - timePassed;

            if (timeLeft > 0) {
                const secondsLeft = Math.ceil(timeLeft / 1000);
                return message.reply(`⏰ Patiente encore **${secondsLeft} secondes** avant de relancer le Squid Game !`);
            }
        }

        let channel;

        if (args[0]) {
            channel = message.guild.channels.cache.get(args[0]);
            if (!channel || channel.type !== 2) {
                return message.reply("❌ Salon vocal invalide.");
            }
        } else {
            channel = message.member.voice.channel;
            if (!channel) {
                return message.reply("❌ Tu dois être dans un salon vocal.");
            }
        }

        if (getVoiceConnection(message.guild.id)) {
            return message.reply("⚠️ Je suis déjà dans un salon vocal.");
        }

        // Définir le cooldown APRÈS toutes les vérifications
        cooldowns.set(guildId, Date.now());

        let connection, player;

        try {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            await entersState(connection, VoiceConnectionStatus.Ready, 20000);
            message.channel.send(`🎮 **Squid Game lancé dans ${channel.name}...**`);

            const { delayMin, delayMax } = config.squidgame;
            const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;

            message.channel.send(`⏳ Le jeu commence dans ${Math.round(delay/1000)} secondes...`);
            await new Promise(r => setTimeout(r, delay));

            message.channel.send('🔴🟢 **Red Light, Green Light!**');

            // Jouer un fichier local
            const audioPath = path.join(__dirname, '../sounds/squidgame.mp3');
            player = createAudioPlayer();
            const resource = createAudioResource(audioPath);

            connection.subscribe(player);
            player.play(resource);

            await new Promise((resolve) => {
                player.on(AudioPlayerStatus.Idle, resolve);
                setTimeout(resolve, 180000);
            });

            await new Promise(r => setTimeout(r, 1000));

            const members = channel.members.filter(m => !m.user.bot);

            if (members.size > 0) {
                const victim = members.random();
                await victim.voice.disconnect();
                message.channel.send(`💀 **${victim.user.tag}** a été éliminé ! RIP 🪦`);
            }

        } catch (err) {
            console.error('Erreur Squid Game:', err);
            message.reply('❌ Erreur: ' + err.message);
            // En cas d'erreur, retirer le cooldown pour permettre de réessayer
            cooldowns.delete(guildId);
        } finally {
            if (player) player.stop();
            if (connection) setTimeout(() => connection.destroy(), 2000);
        }
    }
};