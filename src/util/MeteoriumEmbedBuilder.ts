import { APIEmbed, EmbedBuilder, EmbedData, User } from "discord.js";

export class MeteoriumEmbedBuilder extends EmbedBuilder {
    constructor(data?: EmbedData | APIEmbed | undefined, user?: User, dontsetinitialdata?: boolean) {
        super(data);
        if (!dontsetinitialdata) {
            this.setColor([0, 153, 255])
                .setFooter({
                    text: "Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)",
                })
                .setTimestamp();
            if (user) {
                this.setFooter({
                    text:
                        "Requested by " +
                        user.tag +
                        " (" +
                        user.id +
                        ") | Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)",
                    iconURL: user.avatarURL() || user.defaultAvatarURL,
                });
            }
        }
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
