import {
    ContextMenuCommandBuilder,
    ApplicationCommandType,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import type { MeteoriumMessageContextMenuAction } from "..";

export const ContextMenuAction: MeteoriumMessageContextMenuAction = {
    Name: "SayIn reply",
    Type: ApplicationCommandType.Message,
    InteractionData: new ContextMenuCommandBuilder().setName("SayIn reply").setType(ApplicationCommandType.Message),
    async Callback(interaction, client) {
        if (!interaction.member.permissions.has("ManageMessages"))
            return await interaction.reply({ content: "You do not have permission to use SayIn." });

        const modal = new ModalBuilder().setCustomId("SayInReplyModal").setTitle("SayIn reply configuration");

        const messageInput = new TextInputBuilder()
            .setCustomId("Message")
            .setLabel("Message")
            .setPlaceholder("The content of the reply message")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const showExecutorNameInput = new TextInputBuilder()
            .setCustomId("ShowExecutorName")
            .setLabel("Show executor name")
            .setPlaceholder('Strictly "yes" or "no", leave blank to specify no')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(showExecutorNameInput),
        );

        await interaction.showModal(modal);
        const modalSubmitInteraction = await interaction.awaitModalSubmit({
            filter: (interaction) => interaction.customId == "SayInReplyModal",
            time: 60000,
        });

        const GuildSetting = await client.Database.guild.findUnique({
            where: { GuildId: String(interaction.guildId) },
        });
        if (!GuildSetting)
            return await interaction.editReply({
                content: "No guild setting inside database?",
            });

        const ShowExecutorName =
            GuildSetting.EnforceSayInExecutor && !interaction.member.permissions.has("Administrator", true)
                ? true
                : modalSubmitInteraction.fields.getTextInputValue("ShowExecutorName").toLowerCase() == "no"
                ? false
                : true;

        const Message = ShowExecutorName
            ? `${modalSubmitInteraction.fields.getTextInputValue("Message")}\n\n(Sayin command executed by ${
                  interaction.user.tag
              } (${interaction.user.id}))`
            : modalSubmitInteraction.fields.getTextInputValue("Message");

        await interaction.targetMessage.channel.send({
            content: Message,
            reply: { messageReference: interaction.targetMessage },
        });

        return await modalSubmitInteraction.reply({ content: "Sent reply", ephemeral: true });
    },
};
