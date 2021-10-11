module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        client.user.setPresence("idle");
        client.user.setActivity("no", { type: "playing" });
    }
}