import { Client as NekoLoveAPIClient } from "neko-love";
import { SlashCommandBuilder } from 'discord.js';
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";

const NekoLoveClient = new NekoLoveAPIClient();

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("nekoloveapi")
        .setDescription("Commands for getting pictures from neko-love.xyz")
        .addStringOption(option => option.setName("action")
                                        .setDescription("Action")
                                        .setRequired(true)
                                        .addChoices(
                                            // Action picture/gif
                                            { name: "pat", value: "pat" },
                                            { name: "hug", value: "hug" },
                                            { name: "cry", value: "cry" },
                                            { name: "kiss", value: "kiss" },
                                            { name: "slap", value: "slap" },
                                            { name: "smug", value: "smug" },
                                            { name: "punch", value: "punch" },

                                            // Art
                                            { name: "waifu", value: "waifu" },
                                            { name: "kitsune", value: "kitsune" },
                                            { name: "neko", value: "neko" }
                                        ))
        .addBooleanOption(option => option.setName("ephemeral").setDescription("If true, the response will be only shown to you").setRequired(false)),
    async Callback(interaction) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });
        const Action = interaction.options.getString("action", true);

        try {
            const Response = await NekoLoveClient.get(Action);
            if (!(Response.code === 200)) throw new Error(`Response code not 200 (${Response.code})`)
            await interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                        .setTitle(`Random anime ${Action} picture/gif`)
                        .setDescription(`[Click here for direct link](${Response.url})`)
                        .setImage(Response.url)
                ]
            });
        } catch(err) {
            console.error(`Error occurred while getting a picture from neko-life.xyz (${Action}):\n`, err)
            await interaction.editReply({
                embeds: [
                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                        .setTitle(`Failed getting a random anime ${Action} picture/gif`)
                        .setDescription(String(err))
                ]
            });
        }
        return;
    }
}