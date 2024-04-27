//retrieves files given the filename. VERY BAD PRACTICE DO NOT USE WHEN DEPLOYED VERY UNSAFE UNLESS YOU LIKE CHAOS LIKE ME
//Not connected to frontend as well. But can easily be once hooked to the server.
//Saves the called file in the retrieveds directory. spelled wrong I know
//Can name the downloadAttachment() function as retriever() for consistency
const https = require("https");
const fs = require("fs");
const path = require("path");

const retrievedsDir = path.join(__dirname, "retrieveds");
fs.mkdirSync(retrievedsDir, { recursive: true });

const channelId = 6969696969; //The channel ID goes here, or remove variable and put it in field directly as part of the string

const botToken = "Bot gwaynydgnawuiuhawuuuawud"; //Bot token here, as a string. Or again, put it directly in the area where header options go
// note: the space after Bot is necessary.

function getMessageIDs(filename) {
  const jsonData = fs.readFileSync(
    path.join(__dirname, "messageIDs.json"),
    "utf8"
  );
  const messageIDs = JSON.parse(jsonData);
  if (messageIDs.hasOwnProperty(filename)) {
    return messageIDs[filename];
  } else {
    return [];
  }
}

function downloadAttachment(filename) {
  const messageIDs = getMessageIDs(filename);

  console.log(messageIDs);

  if (messageIDs.length === 0) {
    console.log(`No message IDs found for ${filename}`);
    return;
  }

  if (!fs.existsSync("retrieveds")) {
    fs.mkdirSync("retrieveds");
  }

  if (messageIDs.length === 1) {
    // Single message ID, download the attachment directly
    const messageID = messageIDs[0];
    downloadAttachmentForMessage(messageID)
      .then((attachmentPath) => {
        if (attachmentPath) {
          console.log(`Downloaded attachment: ${attachmentPath}`);
        }
      })
      .catch((error) => {
        console.error("Error downloading attachment:", error);
      });
  } else {
    // Multiple message IDs, compile attachments into a single file
    const fileExtension = getFileExtensionFromReceivedFiles(filename);
    const cleanFilename = trimFileName(filename);
    const compiledFilePath = path.join(
      "retrieveds",
      `${cleanFilename}${fileExtension}`
    );
    const writeStream = fs.createWriteStream(compiledFilePath);

    const pipeAttachments = async () => {
      try {
        for (const messageID of messageIDs) {
          const attachmentPath = await downloadAttachmentForMessage(messageID);

          if (attachmentPath) {
            const readStream = fs.createReadStream(attachmentPath);
            await pipeToWriteStream(readStream, writeStream);
            fs.unlinkSync(attachmentPath); // Delete the temporary file
          }
        }
        writeStream.end();
      } catch (error) {
        console.error("Error downloading or compiling attachments:", error);
      }
    };

    pipeAttachments();
  }
}
function getFileExtensionFromReceivedFiles(filenameR) {
  const receivedFilesPath = path.join(__dirname, "received_files.txt");

  try {
    const receivedFilesData = fs.readFileSync(receivedFilesPath, "utf8");
    const lines = receivedFilesData.split("\n");

    for (const line of lines) {
      const lastDotIndex = line.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        const filename = line.slice(0, lastDotIndex);
        const extension = line.slice(lastDotIndex + 1);

        if (filename === filenameR) {
          return `.${extension}`;
        }
      }
    }
  } catch (err) {
    console.error(`Error reading received_files.txt: ${err}`);
  }

  // If the filename is not found, return an empty extension
  return "";
}
function trimFileName(filename) {
  return filename.replace(/"/g, "");
}

function downloadAttachmentForMessage(messageID) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "discord.com",
      port: 443,
      path: `/api/v9/channels/${channelId}/messages/${messageID}`,
      method: "GET",
      headers: {
        Authorization: botToken,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const messageObject = JSON.parse(data);

        if (messageObject.attachments.length > 0) {
          const attachment = messageObject.attachments[0]; // Assuming only one attachment
          const attachmentURL = attachment.url;
          const attachmentFilename = attachment.filename;
          const attachmentPath = path.join("retrieveds", attachmentFilename);

          downloadFileFromURL(attachmentURL, attachmentPath)
            .then(() => {
              console.log(`Downloaded attachment for message ${messageID}`);
              resolve(attachmentPath);
            })
            .catch((err) => {
              console.error("Error downloading attachment:", err);
              reject(err);
            });
        } else {
          console.log(`No attachments found in the message ${messageID}`);
          resolve(null); // Resolve with null if no attachments found
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error requesting message details:", error);
      reject(error);
    });

    req.end();
  });
}

function downloadFileFromURL(url, filePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

function pipeToWriteStream(readStream, writeStream) {
  return new Promise((resolve, reject) => {
    readStream.pipe(writeStream, { end: false });

    readStream.on("end", () => {
      resolve();
    });

    readStream.on("error", (err) => {
      reject(err);
    });
  });
}
downloadAttachment("filename_here");
//Pass the name of the file you want to retrieve from the channel, above in the place that says 'filename_here'.
//Use the messageIDs.json filename ONLY.
//The filename should exist in the messageIDs.json AND the received_files.txt. Use the messageIDs.json name
//In received_files.txt it will have its name AND extension. It won't in messageIDs.json. Because I'm dumb.
