import { EmbedBuilder, APIEmbed, EmbedData, User } from "discord.js";

export default class MeteoriumEmbedBuilder extends EmbedBuilder {
    public constructor(requester?: User, data?: EmbedData | APIEmbed) {
        super(data);

        this.setTimestamp();
        this.setNormalColor();
        this.setFooter({
            text: `${requester ? `Requested by ${requester.username} (${requester.id}) | ` : ""}Meteorium | v3`,
            iconURL: requester
                ? requester.avatarURL({ extension: "png", size: 128 }) || requester.defaultAvatarURL
                : undefined,
        });

        return this;
    }

    public setNormalColor() {
        this.setColor([0, 153, 255]);
        return this;
    }

    public setErrorColor() {
        this.setColor([255, 0, 0]);
        return this;
    }
}
