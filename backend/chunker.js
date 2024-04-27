//Chunks the bigger files into 24mb chunks
//Only limited by time
const fs = require("fs");
const path = require("path");
const https = require("https");
const FormData = require("form-data");

const CHUNK_SIZE = 24 * 1024 * 1024; // 24MB

const channelId = 6969696969; //The channel ID goes here, or remove variable and put it in field directly as part of the string

const botToken = "Bot gwaynydgnawuiuhawuuuawud"; //Bot token here, as a string. Or again, put it directly in the area where header options go
// note: the space after Bot is necessary.

async function chunker(filePath, callback) {
  try {
    let fileNumber = 1;
    let currentChunkSize = 0;
    const inputStream = fs.createReadStream(filePath, {
      highWaterMark: CHUNK_SIZE,
    });
    let form = new FormData();
    const fileName = path.parse(filePath).name;
    const messageIDs = [];

    const sendChunkWithCallback = (form, callback) => {
      return new Promise((resolve, reject) => {
        sendChunk(form, (statusCode, response) => {
          if (statusCode === 200) {
            messageIDs.push(response.id); // Store the message ID
            resolve();
          } else {
            console.error("Error sending chunk:", response.error);
            reject(response.error);
          }
          callback(statusCode, response);
        });
      });
    };

    for await (const chunk of inputStream) {
      if (!form) {
        form = new FormData();
      }

      // Append the chunk to the FormData
      form.append("file", chunk, {
        filename: `${path.basename(filePath)}_${fileNumber}`,
        contentType: "application/octet-stream",
      });

      currentChunkSize += chunk.length;

      if (currentChunkSize >= CHUNK_SIZE) {
        await sendChunkWithCallback(form, (statusCode, response) => {
          if (statusCode !== 200) {
            console.error("Error sending chunk:", response.error);
          }
        });
        form = null;
        currentChunkSize = 0;
        fileNumber++;
      }
    }

    // Send the last chunk
    if (form && form.getLengthSync() > 0) {
      await sendChunkWithCallback(form, (statusCode, response) => {
        if (statusCode !== 200) {
          console.error("Error sending chunk:", response.error);
        }
      });
    }

    console.log("File split and sent as Discord messages.");
    callback(200, { message: "File split and sent as Discord messages." });
    storeMessageIDs(fileName, messageIDs);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log(`Deleted file: ${filePath}`);
      }
    });
    return messageIDs;
  } catch (err) {
    console.error("Error in chunker:", err);
    callback(500, { error: "Internal server error" });
  }
}

const MAX_RETRIES = 3; // Maximum number of retries

function sendChunk(form, callback) {
  let retries = 0;

  const sendRequest = () => {
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
        callback(res.statusCode, JSON.parse(data));
      });
    });

    req.on("error", (error) => {
      console.error(`Retry attempt ${retries}: ${error}`);
      retries++;

      if (retries <= MAX_RETRIES) {
        setTimeout(sendRequest, 2000); // Retry after 2 seconds
      } else {
        console.error("Max retries reached. Aborting...");
        callback(500, { error: "Internal server error" });
      }
    });

    // Pipe the form data into the request
    form.pipe(req);
  };

  sendRequest();
}

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

module.exports = chunker;
