import type { MeteoriumEvent } from ".";
import { ActivityType, REST, Routes } from "discord.js";

export const Event: MeteoriumEvent<"ready"> = {
    async Callback(client) {
        const readyNS = client.Logging.GetNamespace("Events/ready");
        const CommandsMapped = client.Commands.map((Command) => Command.InteractionData.toJSON());

        readyNS.info("Registering global slash commands at Discord");
        await client.application.commands.set(CommandsMapped); // Global slash commands

        readyNS.info("Registering guild slash commands at Discord");
        const Rest = new REST({ version: "10" });
        Rest.setToken(client.token);
        client.Config.InteractionFirstDeployGuildIds.forEach(async (guildId) => {
            readyNS.info(`Registering guild slash commands -> ${guildId}`);
            await Rest.put(Routes.applicationGuildCommands(client.Config.DiscordApplicationId, guildId), {
                body: CommandsMapped,
            }).catch((e) => {
                readyNS.error(`Failed while registering guild slash commands for guild ${guildId}:\n${e}`);
            });
        });

        readyNS.verbose("Setting user presence");
        client.user.setPresence({
            status: "idle",
            activities: [{ name: "no", type: ActivityType.Playing }],
        });

        readyNS.info("Bot ready");
        return;
    },
};
