const redis = require('redis')

let redisClient = null;

(async () => {
    redisClient = redis.createClient();

    redisClient.on("error", (error) => {
        console.log(error);
    });
    redisClient.on("connect", () => {
        console.log("Redis connected!");
    });

    await redisClient.connect();
})();

module.exports = redisClient;
