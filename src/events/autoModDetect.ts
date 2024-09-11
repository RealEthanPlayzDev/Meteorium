import { AutoModerationActionType } from "discord.js";
import { GuildFeatures, ModerationAction } from "@prisma/client";
import type { MeteoriumEvent } from "./eventsEntry.js";

export const Event: MeteoriumEvent<"autoModerationActionExecution"> = {
    event: "autoModerationActionExecution",
    async callback(client, exec) {
        const guildSettings = await client.db.guild.findUnique({ where: { GuildId: exec.guild.id } });
        if (!guildSettings) throw new Error("could not get settings from database");
        if (!guildSettings.CreateCaseFromAutoMod) return;
        if (!client.guildFeatures.hasFeatureEnabled(exec.guild.id, GuildFeatures.Moderation)) return;

        const rule =
            exec.autoModerationRule || (await exec.guild.autoModerationRules.fetch(exec.ruleId).catch(() => null));
        if (!rule) return;

        await client.dbUtils.createModerationCase({
            Action:
                exec.action.type == AutoModerationActionType.Timeout ? ModerationAction.Mute : ModerationAction.Warn,
            GuildId: exec.guild.id,
            TargetUserId: exec.userId,
            ModeratorUserId: rule.creatorId,
            Reason: `Automatically generated case from Auto Moderation (automod) trigger:\n${rule.name}`,
            Duration:
                exec.action.type == AutoModerationActionType.Timeout
                    ? exec.action.metadata.durationSeconds
                        ? (exec.action.metadata.durationSeconds * 1000).toString()
                        : "0"
                    : undefined,
        });

        return;
    },
    once: false,
};
