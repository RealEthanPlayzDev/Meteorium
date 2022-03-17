const { SlashCommandBuilder } = require("@discordjs/builders");
const MeteoriumCommand = require("../../util/Command");
const nobloxjs = require("noblox.js");
const MeteoriumEmbed = require("../../util/MeteoriumEmbed");
const { stringify } = require("querystring");

module.exports = new MeteoriumCommand("rbxapi", "Roblox API", async (interaction, client) => {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();
    switch(subcommand) {
        case "fetchassetinfo": {
            const assetid = interaction.options.getNumber("assetid");
            const assetinfo = await nobloxjs.getProductInfo(assetid);

            const embedfields = [
                {
                    name: "Creator",
                    value: `${assetinfo.Creator.Name} (${assetinfo.Creator.Id})`
                },
                {
                    name: "AssetId",
                    value: assetinfo.AssetId ? assetinfo.AssetId : "N/A"
                },
                {
                    name: "ProductId",
                    value: assetinfo.ProductId ? assetinfo.ProductId : "N/A"
                },
                {
                    name: "Asset type id",
                    value: assetinfo.AssetTypeId ? assetinfo.AssetTypeId : "N/A"
                },
                {
                    name: "Sales",
                    value: assetinfo.Sales ? assetinfo.Sales : "N/A"
                },
                {
                    name: "Remaining",
                    value: assetinfo.Remaining ? assetinfo.Remaining : "N/A"
                },
                {
                    name: "Created at",
                    value: assetinfo.Created ? assetinfo.Created : "N/A"
                },
                {
                    name: "Last updated at",
                    value: assetinfo.Updated ? assetinfo.Updated : "N/A"
                },
                {
                    name: "Price (in Robux)",
                    value: assetinfo.PriceInRobux ? assetinfo.PriceInRobux : "N/A"
                },
                {
                    name: "On sale",
                    value: assetinfo.IsForSale ? assetinfo.IsForSale : "N/A"
                },
                {
                    name: "Asset is a limited",
                    value: assetinfo.IsLimited ? assetinfo.IsLimited : "N/A"
                },
                {
                    name: "Asset is a unique limited",
                    value: assetinfo.IsLimitedUnique ? assetinfo.IsLimitedUnique : "N/A"
                },
                {
                    name: "IsNew",
                    value: assetinfo.IsNew ? assetinfo.IsNew : "N/A"
                },
                {
                    name: "IsPublicDomain",
                    value: assetinfo.IsPublicDomain ? assetinfo.IsPublicDomain : "N/A"
                },
                {
                    name: "Minimum membership level",
                    value: assetinfo.MinimumMembershipLevel ? assetinfo.MinimumMembershipLevel : "N/A"
                },
                {
                    name: "ContentRatingTypeId",
                    value: assetinfo.ContentRatingTypeId ? assetinfo.ContentRatingTypeId : "N/A"
                }
            ]

            embedfields.forEach((v,i) => {
                if (stringify(v.value) === "") {
                    v.value = "N/A"
                }
            })

            return interaction.editReply({ embeds: [
                new MeteoriumEmbed(assetinfo.Name, assetinfo.Description)
                    .setURL(`https://roblox.com/library/${assetinfo.AssetId}`)
                    .addFields(embedfields)
            ] });
        }
    }
}, new SlashCommandBuilder()
    .setName("rbxapi")
    .setDescription("Roblox API - Powered by Roblox's web api")
    .addSubcommand(subcommand => subcommand.setName("fetchassetinfo")
                                        .setDescription("Gets information of a asset using a asset id")
                                        .addNumberOption(option => option.setName("assetid").setDescription("The target channel id").setRequired(true)))
);