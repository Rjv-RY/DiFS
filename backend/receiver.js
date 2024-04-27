//Receives the files sent/uploaded from frontend. In case I didn't pass the mkdir
//for the directories where the files are sent, sorry :(. the error should tell you what you're missing
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const options = { maxFileSize: 3 * 1024 * 1024 * 1024 }; //Change this to change formidable's max file size option
//This is what determines how big a file you can send. Max i've done is 2.74GB
async function receive(req, callback) {
  const form = new formidable.IncomingForm(options);

  form.uploadDir = path.join(process.cwd(), "uploads");

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form", err);
      return callback(err);
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !file.filepath) {
      console.error("Error: file.path is undefined");
      return callback(new Error("file.path is undefined"));
    }

    console.log("Filepath:", file.filepath);
    console.log("Filename:", file.originalFilename || file.name);

    const originalFileName = file.originalFilename || file.name;
    const fileName = await getUniqueFileName(originalFileName);

    const oldPath = file.filepath;
    const newPath = path.join(form.uploadDir, fileName);

    fs.rename(oldPath, newPath, async (err) => {
      if (err) {
        console.error("Error moving file", err);
        return callback(err);
      }

      console.log("File upload success:", newPath);
      await saveFileName(fileName); // Save the unique file name

      const result = { message: "File upload success:", fileName: newPath };
      callback(null, { result });
    });
  });
}

async function getUniqueFileName(fileName, count = 0) {
  const { name, ext } = path.parse(fileName);
  const numberedFileName = count === 0 ? fileName : `${name} (${count})${ext}`;
  const fileNamePath = path.join(process.cwd(), "received_files.txt");

  try {
    const fileContents = await fs.promises.readFile(fileNamePath, "utf8");
    const fileNames = fileContents.trim().split("\n");

    if (fileNames.includes(numberedFileName)) {
      return getUniqueFileName(fileName, count + 1);
    } else {
      return numberedFileName;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.promises.writeFile(fileNamePath, "");
      return numberedFileName;
    } else {
      throw error;
    }
  }
}

async function saveFileName(fileName) {
  const fileNamePath = path.join(process.cwd(), "received_files.txt");
  try {
    // Append the file name to the file
    await fs.appendFile(fileNamePath, `${fileName}\n`, (err) => {
      if (err) {
        console.error("Error saving file name:", err);
      } else {
        console.log("File name saved:", fileName);
      }
    });
  } catch (error) {
    console.error("Error saving file name:", error);
  }
}

module.exports = receive;
