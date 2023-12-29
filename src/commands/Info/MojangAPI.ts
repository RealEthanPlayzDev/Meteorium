import { SlashCommandBuilder } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import * as MojangAPI from "../../util/MojangAPI";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("mojangapi")
        .setDescription("Get Minecraft information from Mojang APIs")
        .addSubcommandGroup((group) =>
            group
                .setName("profile")
                .setDescription("Get a user's profile information")
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("username")
                        .setDescription("By username")
                        .addStringOption((option) =>
                            option.setName("username").setDescription("The username of the player").setRequired(true),
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("ephemeral")
                                .setDescription("If true, the response will only be shown to you")
                                .setRequired(false),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("uuid")
                        .setDescription("By uuid")
                        .addStringOption((option) =>
                            option.setName("uuid").setDescription("The uuid of the player").setRequired(true),
                        )
                        .addBooleanOption((option) =>
                            option
                                .setName("ephemeral")
                                .setDescription("If true, the response will only be shown to you")
                                .setRequired(false),
                        ),
                ),
        ),
    async Callback(interaction, _) {
        const Ephemeral = interaction.options.getBoolean("ephemeral", false) ? true : false;
        await interaction.deferReply({ ephemeral: Ephemeral });

        const SubcommandGroup = interaction.options.getSubcommandGroup();
        const Subcommand = interaction.options.getSubcommand();

        switch (SubcommandGroup) {
            case "profile": {
                let UUID: string;
                if (Subcommand == "uuid") UUID = interaction.options.getString("uuid", true);
                else {
                    const res = await MojangAPI.getUUIDFromName(interaction.options.getString("name", true));
                    if (res.code == 204 || res.code == 404)
                        return await interaction.editReply("The username/profiile doesn't exist.");
                    if (res.code != 200)
                        return await interaction.editReply(
                            "Failed while fetching information from Mojang's API (username to uuid status code not 200)",
                        );
                    UUID = res.data.id;
                }

                const Profile = await MojangAPI.getProfile(UUID);
                if (Profile.code != 200)
                    return await interaction.editReply(
                        "Failed while fetching information from Mojang's API (username to uuid status code not 200)",
                    );
                const ProfileTextures = MojangAPI.decodeTexturesB64(Profile.data.properties[0].value);

                const Embed = new MeteoriumEmbedBuilder()
                    .setNormalColor()
                    .setTitle(Profile.data.name)
                    .addFields([
                        { name: "UUID", value: Profile.data.id },
                        {
                            name: "Profile actions",
                            value:
                                Profile.data.profileActions.length == 0
                                    ? "N/A"
                                    : Profile.data.profileActions.toString(),
                        },
                        {
                            name: "Skin url",
                            value:
                                ProfileTextures.textures.SKIN == undefined
                                    ? `Default (${MojangAPI.decodeDefaultSkin(UUID)})`
                                    : ProfileTextures.textures.SKIN.url,
                        },
                        {
                            name: "Skin type",
                            value:
                                ProfileTextures.textures.SKIN == undefined
                                    ? "N/A"
                                    : ProfileTextures.textures.SKIN.metadata == undefined
                                    ? "Classic"
                                    : "Slim",
                        },
                        {
                            name: "Cape url",
                            value:
                                ProfileTextures.textures.CAPE == undefined ? "N/A" : ProfileTextures.textures.CAPE.url,
                        },
                    ]);
                
                return await interaction.editReply({ embeds: [ Embed ] });
            }
        }
    },
};
