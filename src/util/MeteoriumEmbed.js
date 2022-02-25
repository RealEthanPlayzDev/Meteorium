// Custom embed object that doesn't provide that much functionality other than providing a template default embed
// One of the main motivation I decided to make a custom embed class wrapping around MessageEmbed is because
// that I re-use the same setFooter, timestamp, and other code as a "template", this makes code basically more
// messier and spaghettier, I don't think I phrased this well
// I also made this because the MessageEmbed codes looks messy, after migrating them to MeteoriumCommand they
// look much cleaner

const { MessageEmbed } = require("discord.js");

class MeteoriumEmbed extends MessageEmbed {
     constructor(title = "MeteoriumEmbed", description = "Placeholder description", color = "0099ff") {
         super();
         super.setTitle(title);
         super.setDescription(description);
         super.setColor(color);
         super.setFooter({ text: "Meteorium | Developed by RadiatedExodus (RealEthanPlayzDev)" })
         super.setTimestamp();
     }

     // TODO: Use enums or something similar instead
     UseNormalColor() {
         return super.setColor("0099ff");
     }

     UseErrorColor() {
        return super.setColor("FF0000");
    }
}

module.exports = MeteoriumEmbed;