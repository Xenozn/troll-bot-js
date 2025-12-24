module.exports = {
    name: 'troll-help',
    description: 'Affiche toutes les commandes disponibles',
    execute(message, args) {
        const commands = message.client.commands; // Collection de toutes les commandes
        if (!commands || commands.size === 0) return message.channel.send('Aucune commande disponible.');

        let reply = '**Liste des commandes :**\n\n';
        commands.forEach(cmd => {
            reply += `**!${cmd.name}** → ${cmd.description}\n`;
        });

        message.channel.send(reply);
    },
};
