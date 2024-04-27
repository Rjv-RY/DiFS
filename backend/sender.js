//Sends the file to Discord. Uses only one thread probably, so is 100% functional, and 1000% slow.
//But not significant in single messages. For Chunks/big files though though
const fs = require("fs");
const https = require("https");
const path = require("path");
const FormData = require("form-data");
const chunker = require("./chunker");

const channelId = 67382882; //The channel ID goes here, or remove variable and put it in field directly as part of the string

const botToken = "Bot gwaynydgnawuiuhawuuuawud"; //Bot token here, as a string. Or again, put it directly in the area where header options go
// note: the space after Bot is necessary. "Bot"'s B is caps.

const CHUNK_SIZE = 24 * 1024 * 1024; // 24MB

const messageIDsFile = "messageIDs.json";

function storeMessageIDs(fileName, messageIDs) {
  let existingData = {};
  try {
    const fileContent = fs.readFileSync(messageIDsFile, "utf8");
    if (fileContent) {
      existingData = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading existing data:", error);
  }
  existingData[fileName] = messageIDs;
  const fileContent = JSON.stringify(existingData);
  fs.writeFileSync(messageIDsFile, fileContent);
}

function sender(filePath, callback) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      console.error("Error getting file stats:", err);
      return callback(500, { error: "Internal server error" });
    }
    if (stats.size <= CHUNK_SIZE) {
      // If file size is smaller than or equal to CHUNK_SIZE, send the entire file in one message
      sendFile(filePath, callback);
    } else {
      // If file size exceeds CHUNK_SIZE, chunk the file and send as separate messages
      chunker(filePath, callback);
    }
  });
}

function sendFile(filePath, callback) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: "application/octet-stream",
  });

  const options = {
    hostname: "discord.com",
    path: `/api/v9/channels/${channelId}/messages`,
    method: "POST",
    headers: {
      ...form.getHeaders(),
      Authorization: botToken,
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      const response = JSON.parse(data);
      const messageID = response.id;
      const fileName = path.parse(filePath).name; // Get the file name without extension
      storeMessageIDs(fileName, [messageID]); // Store the message ID in the file
      callback(res.statusCode, response);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log(`Deleted file: ${filePath}`);
        }
      });
    });
  });

  req.on("error", (error) => {
    console.error(error);
    callback(500, { error: "Internal server error" });
  });

  form.pipe(req);
}

module.exports = sender;
