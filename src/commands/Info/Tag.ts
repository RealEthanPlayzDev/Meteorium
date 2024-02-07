import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import type { MeteoriumCommand } from "..";
import { MeteoriumEmbedBuilder } from "../../util/MeteoriumEmbedBuilder";
import { Tag } from "@prisma/client";

export const Command: MeteoriumCommand = {
    InteractionData: new SlashCommandBuilder()
        .setName("tag")
        .setDescription("Tag suggestion system")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("create")
                .setDescription("Create a new tag")
                .addStringOption((option) => option.setName("name").setDescription("The tag name").setRequired(true))
                .addStringOption((option) =>
                    option.setName("content").setDescription("The content of this tag").setRequired(true),
                )
                .addAttachmentOption((option) =>
                    option
                        .setName("image")
                        .setDescription("Optional image to be shown with the tag")
                        .setRequired(false),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription("Delete a existing tag")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("The name of the tag to be deleted")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("edit")
                .setDescription("Edit a existing tag")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("The name of the tag to be edited")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addStringOption((option) =>
                    option.setName("content").setDescription("The new content of this tag").setRequired(false),
                )
                .addAttachmentOption((option) =>
                    option
                        .setName("image")
                        .setDescription("Optional image to be shown with the tag")
                        .setRequired(false),
                )
                .addBooleanOption((option) =>
                    option
                        .setName("removeimage")
                        .setDescription("Set this to true to remove the image (overrides image)")
                        .setRequired(false),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("show")
                .setDescription("Show a tag")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("The name of the tag to be shown")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addUserOption((option) =>
                    option.setName("suggestto").setDescription("Suggest this tag to someone").setRequired(false),
                )
                .addBooleanOption((option) =>
                    option
                        .setName("detach")
                        .setDescription(
                            "If true, the tag message will be sent detached from interaction result message",
                        )
                        .setRequired(false),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("list")
                .setDescription("List tags made in this server")
                .addBooleanOption((option) =>
                    option
                        .setName("ephemeral")
                        .setDescription("If true, list will be shown only to you")
                        .setRequired(false),
                ),
        ),
    async Callback(interaction, client) {
        const Subcommand = interaction.options.getSubcommand(true);
        switch (Subcommand) {
            case "create": {
                const TagName = interaction.options.getString("name", true); // All subcommands require the name field

                if (!interaction.member.permissions.has("ManageMessages"))
                    return await interaction.reply({ content: "You do not have permission to manage tags." });

                const ExistingTagExist =
                    (await client.Database.tag.count({ where: { TagName: TagName, GuildId: interaction.guildId } })) !=
                    0;
                if (ExistingTagExist)
                    return await interaction.reply({
                        content: "There is already a existing tag with the same name.",
                        ephemeral: true,
                    });

                const Content = interaction.options.getString("content", true);
                const Image = interaction.options.getAttachment("image", false);

                await client.Database.tag.create({
                    data: {
                        TagName: TagName,
                        GuildId: interaction.guildId,
                        Content: Content,
                        Image: Image ? Image.url : "",
                    },
                });

                const TagEmbed = new MeteoriumEmbedBuilder()
                    .setAuthor({ name: "Tag suggestion" })
                    .setDescription(Content)
                    .setImage(Image ? Image?.url : null)
                    .setColor("Green");

                const GuildSetting = await client.Database.guild.findUnique({
                    where: { GuildId: interaction.guild.id },
                });
                if (GuildSetting && GuildSetting.LoggingChannelId != "")
                    client.channels
                        .fetch(GuildSetting.LoggingChannelId)
                        .then(async (channel) => {
                            if (channel && channel.isTextBased())
                                await channel.send({
                                    embeds: [
                                        new MeteoriumEmbedBuilder(undefined, interaction.user)
                                            .setTitle("Tag created")
                                            .setFields([
                                                {
                                                    name: "Creator",
                                                    value: `${interaction.user.username} (${interaction.user.id}) (<@${interaction.user.id}>)`,
                                                },
                                                { name: "Content", value: Content },
                                            ])
                                            .setImage(Image ? Image?.url : null)
                                            .setColor("Green"),
                                    ],
                                });
                        })
                        .catch(() => null);

                return await interaction.reply({ content: `Created tag with name ${TagName}`, embeds: [TagEmbed] });
            }
            case "delete": {
                const TagName = interaction.options.getString("name", true); // All subcommands require the name field

                if (!interaction.member.permissions.has("ManageMessages"))
                    return await interaction.reply({ content: "You do not have permission to manage tags." });

                const Tag = await client.Database.tag.findFirst({
                    where: { TagName: TagName, GuildId: interaction.guildId },
                });
                if (!Tag) return await interaction.reply({ content: "Tag does not exist.", ephemeral: true });

                const TagEmbed = new MeteoriumEmbedBuilder()
                    .setAuthor({ name: "Tag suggestion" })
                    .setDescription(Tag.Content)
                    .setImage(Tag.Image != "" ? Tag.Image : null)
                    .setColor("Green");

                const ActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
                    new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Danger),
                ]);

                const ConfirmationReplyResult = await interaction.reply({
                    content: `Are you sure you want to remove the following tag? (${TagName})`,
                    embeds: [TagEmbed],
                    components: [ActionRow],
                    ephemeral: true,
                    fetchReply: true,
                });

                const ResultCollector = ConfirmationReplyResult.createMessageComponentCollector({
                    time: 60000,
                    max: 1,
                });
                ResultCollector.on("collect", async (result) => {
                    if (result.user.id != interaction.user.id) {
                        await result.reply({
                            content: "You can't interact with this interaction as you were not the original executer!",
                            ephemeral: true,
                        });
                        return;
                    }
                    switch (result.customId) {
                        case "yes": {
                            await client.Database.tag.delete({ where: { GlobalTagId: Tag.GlobalTagId } });
                            await interaction.editReply({
                                content: `Tag ${TagName} deleted.`,
                                embeds: [],
                                components: [],
                            });
                            const GuildSetting = await client.Database.guild.findUnique({
                                where: { GuildId: interaction.guild.id },
                            });
                            if (GuildSetting && GuildSetting.LoggingChannelId != "")
                                client.channels
                                    .fetch(GuildSetting.LoggingChannelId)
                                    .then(async (channel) => {
                                        if (channel && channel.isTextBased())
                                            await channel.send({
                                                embeds: [
                                                    new MeteoriumEmbedBuilder(undefined, interaction.user)
                                                        .setTitle("Confirmed tag removal")
                                                        .setFields([
                                                            {
                                                                name: "Remover",
                                                                value: `${interaction.user.username} (${interaction.user.id}) (<@${interaction.user.id}>)`,
                                                            },
                                                            { name: "Content", value: Tag.Content },
                                                        ])
                                                        .setImage(Tag.Image != "" ? Tag.Image : null)
                                                        .setColor("Red"),
                                                ],
                                            });
                                    })
                                    .catch(() => null);
                            break;
                        }
                        case "no": {
                            await interaction.editReply({
                                content: "Cancelled tag deletion.",
                                embeds: [],
                                components: [],
                            });
                            break;
                        }
                        default:
                            break;
                    }
                });
                ResultCollector.on("end", async (result) => {
                    if (result.size < 1)
                        await interaction.editReply({ content: "Command timed out.", embeds: [], components: [] });
                });
                break;
            }
            case "edit": {
                const TagName = interaction.options.getString("name", true); // All subcommands require the name field

                if (!interaction.member.permissions.has("ManageMessages"))
                    return await interaction.reply({ content: "You do not have permission to manage tags." });

                const ExistingTagExist = await client.Database.tag.findFirst({
                    where: { TagName: TagName, GuildId: interaction.guildId },
                });
                if (!ExistingTagExist)
                    return await interaction.reply({
                        content: "Tag doesn't exist.",
                        ephemeral: true,
                    });

                const Content = interaction.options.getString("content", false);
                const Image = interaction.options.getAttachment("image", false);
                const RemoveImage = interaction.options.getBoolean("removeimage", false);

                await client.Database.tag.update({
                    where: { GlobalTagId: ExistingTagExist.GlobalTagId },
                    data: {
                        Content: Content ? Content : ExistingTagExist.Content,
                        Image: RemoveImage ? "" : Image ? Image.url : ExistingTagExist.Image,
                    },
                });

                const TagEmbed = new MeteoriumEmbedBuilder()
                    .setAuthor({ name: "Tag suggestion" })
                    .setDescription(Content)
                    .setImage(
                        RemoveImage
                            ? null
                            : Image
                            ? Image.url
                            : ExistingTagExist.Image != ""
                            ? ExistingTagExist.Image
                            : null,
                    )
                    .setColor("Green");

                const GuildSetting = await client.Database.guild.findUnique({
                    where: { GuildId: interaction.guild.id },
                });
                if (GuildSetting && GuildSetting.LoggingChannelId != "")
                    client.channels
                        .fetch(GuildSetting.LoggingChannelId)
                        .then(async (channel) => {
                            if (channel && channel.isTextBased())
                                await channel.send({
                                    embeds: [
                                        new MeteoriumEmbedBuilder(undefined, interaction.user)
                                            .setTitle("Tag edited")
                                            .setFields([
                                                {
                                                    name: "Editor",
                                                    value: `${interaction.user.username} (${interaction.user.id}) (<@${interaction.user.id}>)`,
                                                },
                                                {
                                                    name: "Content",
                                                    value: Content ? Content : ExistingTagExist.Content,
                                                },
                                            ])
                                            .setImage(
                                                RemoveImage
                                                    ? null
                                                    : Image
                                                    ? Image.url
                                                    : ExistingTagExist.Image != ""
                                                    ? ExistingTagExist.Image
                                                    : null,
                                            )
                                            .setColor("Yellow"),
                                    ],
                                });
                        })
                        .catch(() => null);

                return await interaction.reply({
                    content: "Edited tag suggestion",
                    embeds: [TagEmbed],
                });
            }
            case "show": {
                const TagName = interaction.options.getString("name", true); // All subcommands require the name field

                const SuggestToUser = interaction.options.getUser("suggestto", false);
                const DetachMessage = interaction.options.getBoolean("detach", false);

                const Tag = await client.Database.tag.findFirst({
                    where: { TagName: TagName, GuildId: interaction.guildId },
                });
                if (!Tag) return await interaction.reply({ content: "Tag doesn't exist!", ephemeral: true });

                const TagEmbed = new MeteoriumEmbedBuilder()
                    .setAuthor({
                        name: SuggestToUser
                            ? `Tag suggestion for @${SuggestToUser.username} (${SuggestToUser.id})`
                            : "Tag suggestion",
                        iconURL: SuggestToUser ? SuggestToUser.displayAvatarURL({ extension: "png" }) : undefined,
                    })
                    .setDescription(Tag.Content)
                    .setImage(Tag.Image != "" ? Tag.Image : null)
                    .setColor("Green");

                if (DetachMessage) {
                    if (!interaction.channel)
                        return await interaction.reply({ content: "interaction.channel not set", ephemeral: true });
                    await interaction.channel!.send({
                        content: SuggestToUser ? `<@${SuggestToUser.id}>` : undefined,
                        embeds: [TagEmbed],
                    });
                }

                return await interaction.reply({
                    content: DetachMessage
                        ? "Sent tag suggestion"
                        : SuggestToUser
                        ? `<@${SuggestToUser.id}>`
                        : undefined,
                    embeds: DetachMessage ? undefined : [TagEmbed],
                    ephemeral: DetachMessage ? true : false,
                });
            }
            case "list": {
                const Ephemeral = interaction.options.getBoolean("ephemeral", false);
                await interaction.deferReply({ ephemeral: Ephemeral ? true : false });

                const Tags = await client.Database.tag.findMany({
                    where: { GuildId: interaction.guildId },
                    orderBy: [{ TagName: "asc" }],
                });

                if (Tags.length == 0)
                    return await interaction.editReply({ content: "This server does not have any tags." });

                const TagPages: Tag[][] = [[]];
                for (let i = 0; i < Tags.length; i++) {
                    if ((i + 1) % 10 == 0) TagPages.push([]);
                    TagPages.at(-1)!.push(Tags[i]!);
                }

                const GeneratePageEmbed = (index: number) => {
                    if (TagPages[index] == undefined) throw Error("invalid page index");
                    return new MeteoriumEmbedBuilder()
                        .setAuthor({
                            name: `Available server tags - ${interaction.guild.name}`,
                            iconURL: interaction.guild.iconURL()!,
                        })
                        .setFields([
                            ...TagPages[index]!.map((Tag) => ({
                                name: Tag.TagName,
                                value: Tag.Content,
                            })),
                        ])
                        .setFooter({
                            text: TagPages.length > 1 ? `Page ${index + 1}/${TagPages.length}` : "",
                        })
                        .setTimestamp()
                        .setNormalColor();
                };

                const GenerateActionRow = (index: number) => {
                    return new ActionRowBuilder<ButtonBuilder>().addComponents([
                        new ButtonBuilder()
                            .setCustomId(String(index - 1))
                            .setLabel("Previous page")
                            .setEmoji({ name: "◀️" })
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(index <= 0),
                        new ButtonBuilder()
                            .setCustomId(String(index + 1))
                            .setLabel("Next page")
                            .setEmoji({ name: "▶️" })
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(index < 0 || index == TagPages.length - 1),
                    ]);
                };

                const GenerateMessageOptions = (index: number) => ({
                    embeds: [GeneratePageEmbed(index)],
                    components: TagPages.length > 1 ? [GenerateActionRow(index)] : undefined,
                    fetchReply: true,
                });

                const InitialSendResult = await interaction.editReply(GenerateMessageOptions(0));
                if (TagPages.length <= 1) return;

                const ResultCollector = InitialSendResult.createMessageComponentCollector({ idle: 150000 });
                ResultCollector.on("collect", async (result) => {
                    if (result.user.id != interaction.user.id) {
                        await interaction.reply({
                            content: "You're not the one who requested this command!",
                            ephemeral: true,
                        });
                        return;
                    }

                    let Index = -1;
                    try {
                        Index = Number(result.customId);
                    } catch {}
                    if (Index == -1) {
                        await interaction.reply({ content: "Invalid page index", ephemeral: true });
                        return;
                    }

                    await InitialSendResult.edit(GenerateMessageOptions(+Index));
                });
                ResultCollector.on("end", async () => {
                    await interaction.editReply({ components: [GenerateActionRow(-1)] });
                });

                break;
            }
            default:
                break;
        }
    },
    async Autocomplete(interaction, client) {
        const Subcommand = interaction.options.getSubcommand(true);
        if (Subcommand != "create") {
            const Focus = interaction.options.getFocused(true);
            if (Focus.name != "name") return;
            const Tags = await client.Database.tag.findMany({
                where: { GuildId: interaction.guildId, TagName: { startsWith: Focus.value } },
                take: 25,
            });
            return await interaction.respond(Tags.map((choice) => ({ name: choice.TagName, value: choice.TagName })));
        }
    },
};
