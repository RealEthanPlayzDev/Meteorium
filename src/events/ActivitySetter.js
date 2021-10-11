module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        client.user.setPresence("idle");
        client.user.setActivity("no", { type: "playing" });
    }
}