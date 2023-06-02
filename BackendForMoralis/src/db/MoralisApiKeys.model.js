module.exports = (mongoose) => {
    const MoralisApiKeys = mongoose.model(
        "MoralisApiKey",
        mongoose.Schema(
            {                
                email: String,  //can be "BNB", "xDAi", "MATIC", ...
                apiKey: String
            },
            { timestamps: true }
        )
    );
    return MoralisApiKeys;
};
