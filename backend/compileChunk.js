//I'm leaving this in becase EH but retriever has ALL the logic for retrieving a file
const fs = require("fs");
const path = require("path");

function compileChunks(chunkedDirectoryPath, outputFilePath) {
  const outputStream = fs.createWriteStream(outputFilePath);

  // Read all files in the chunked directory
  fs.readdir(chunkedDirectoryPath, (err, files) => {
    if (err) {
      console.error("Error reading chunked directory:", err);
      return;
    }

    // Sort the files based on their filenames
    files.sort();

    // Iterate through each chunked file
    files.forEach((file) => {
      // Check if the file name matches the pattern for chunked files
      if (file.startsWith(path.basename(outputFilePath) + "_")) {
        const chunkedFilePath = path.join(chunkedDirectoryPath, file);

        const inputStream = fs.createReadStream(chunkedFilePath);

        inputStream.on("data", (chunk) => {
          outputStream.write(chunk);
        });

        inputStream.on("end", () => {
          console.log(`Chunk ${chunkedFilePath} appended to output file.`);
          // Close the input stream
          inputStream.close();
        });

        inputStream.on("error", (err) => {
          console.error("Error reading chunked file:", err);
        });
      }
    });
  });

  outputStream.on("finish", () => {
    console.log("File compilation complete.");
    outputStream.close();
  });

  outputStream.on("error", (err) => {
    console.error("Error writing output file:", err);
  });
}

const chunkedDirectoryPath1 = "./retrieveds";
const outputFilePath1 = "./uploads/book.pdf";

compileChunks(chunkedDirectoryPath1, outputFilePath1);
