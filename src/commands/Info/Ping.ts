import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows information about the bot"),
    async Callback(interaction, client) {
        const DeferredMessage = await interaction.deferReply({ fetchReply: true });
        return interaction.editReply(`Websocket ping: ${client.ws.ping} ms\nRoundtrip ping: ${DeferredMessage.createdTimestamp - interaction.createdTimestamp} ms`);
    }
}