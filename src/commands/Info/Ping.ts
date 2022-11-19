import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Gives you the bot's websocket and roundtrip ping"),
    async Callback(interaction, client) {
        const DeferredMessage = await interaction.deferReply({ fetchReply: true });
        return interaction.editReply(`Websocket ping: ${client.ws.ping} ms\nRoundtrip ping: ${DeferredMessage.createdTimestamp - interaction.createdTimestamp} ms`);
    }
}