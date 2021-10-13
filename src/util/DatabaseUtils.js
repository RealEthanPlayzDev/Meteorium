// MongoDB Database wrapper for Meteorium
// Written by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev)
// NOTE: As of October 13 2021 (the same day this was written), this won't be used for the time being.

const mongoose = require("mongoose")

class MeteoriumDatabaseWrapper {
    constructor(url) {
        this.url = url;
    }

    Connect() {
        return new Promise(resolve => {
            mongoose.connect(this.url, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }).then(() => {
                resolve(true);
            }).catch((err) => {
                throw err;
            });
        });
    }

    DefineModel(modelName, data) { // types: String, Number, Date, Buffer, Boolean, Mixed, ObjectId, Array, Decimal128, Map, Schema
        return mongoose.model(modelName, new mongoose.Schema(data));
    }

    NewDocument(model, data) {
        return new model(data);
    }

    SaveDocument(document) {
        return new Promise(resolve => {
            document.save().then((sdoc) => {
                resolve(sdoc);
            }).catch((err) => {
                throw err;
            });
        })
    }

    Close() {
        return new Promise(resolve => {
            await mongoose.disconnect();
            resolve(true);
        });
    }
    
}

module.exports = MeteoriumDatabaseWrapper;