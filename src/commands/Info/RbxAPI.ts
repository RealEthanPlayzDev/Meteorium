import { SlashCommandBuilder } from 'discord.js';
// import { getProductInfo } from 'noblox.js';
import * as nobloxjs from 'noblox.js'; // This is a workaround to solve noblox.js's module export error, see https://github.com/noblox/noblox.js/issues/670
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from '../../util/MeteoriumEmbedBuilder';

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("rbxapi")
        .setDescription("Shows information about something from Roblox (powered by noblox.js)")
        .addSubcommand(subcommand => subcommand.setName("fetchassetinfo")
                                               .setDescription("Gets information about a asset using a asset id")
                                               .addNumberOption(option => option.setName("assetid").setDescription("The asset id").setRequired(true))
                                               .addBooleanOption(option => option.setName("ephemeral").setDescription("If true, the response will be only shown to you").setRequired(false))
        ),
    async Callback(interaction, _) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        const SubcommandTarget = interaction.options.getSubcommand();
        switch(SubcommandTarget) {
            case("assetid"): {
                const AssetInfo = await nobloxjs.getProductInfo(interaction.options.getNumber("assetid", true));
                const EmbedFields = [
                    { name: "Creator", value: `@${AssetInfo.Creator.Name} (${AssetInfo.Creator.Id})` },
                    { name: "AssetId",value: String(AssetInfo.AssetId ? AssetInfo.AssetId : "N/A") },
                    { name: "ProductId",value: String(AssetInfo.ProductId ? AssetInfo.ProductId : "N/A") },
                    { name: "Asset type id", value: String(AssetInfo.AssetTypeId ? AssetInfo.AssetTypeId : "N/A") },
                    { name: "Sales", value: String(AssetInfo.Sales ? AssetInfo.Sales : "N/A") },
                    { name: "Remaining", value: String(AssetInfo.Remaining ? AssetInfo.Remaining : "N/A") },
                    { name: "Created at", value: String(AssetInfo.Created ? AssetInfo.Created : "N/A") },
                    { name: "Last updated at", value: String(AssetInfo.Updated ? AssetInfo.Updated : "N/A") },
                    { name: "Price (in Robux)", value: String(AssetInfo.PriceInRobux ? AssetInfo.PriceInRobux : "N/A") },
                    { name: "On sale", value: String(AssetInfo.IsForSale ? AssetInfo.IsForSale : "N/A") },
                    { name: "Asset is a limited", value: String(AssetInfo.IsLimited ? AssetInfo.IsLimited : "N/A") },
                    { name: "Asset is a unique limited", value: String(AssetInfo.IsLimitedUnique ? AssetInfo.IsLimitedUnique : "N/A") },
                    { name: "IsNew", value: String(AssetInfo.IsNew ? AssetInfo.IsNew : "N/A") },
                    { name: "IsPublicDomain", value: String(AssetInfo.IsPublicDomain ? AssetInfo.IsPublicDomain : "N/A") },
                    { name: "Minimum membership level", value: String(AssetInfo.MinimumMembershipLevel ? AssetInfo.MinimumMembershipLevel : "N/A") },
                    { name: "ContentRatingTypeId", value: String(AssetInfo.ContentRatingTypeId ? AssetInfo.ContentRatingTypeId : "N/A") }
                ]

                return await interaction.editReply({
                    embeds: [
                        new MeteoriumEmbedBuilder(undefined, interaction.user)
                            .setTitle(AssetInfo.Name)
                            .setDescription(AssetInfo.Description)
                            .setURL(`https://roblox.com/library/${AssetInfo.AssetId}`)
                            .addFields(EmbedFields)
                    ]
                })
            }
        }
        return;
    }
}