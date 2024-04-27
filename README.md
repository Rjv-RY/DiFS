# DISCORD AS A FILE STORAGE(DiFS)
(Apologies for any errors)
- This is a project using nodeJS, its built-in https module and the amply provided Discord API, that attempts to use discord as a file storage.
- It sends a file to discord through a frontend, then saves its message ID to retrieve it when needed. All you have to do is use its filename to do so granted the message ID is saved and filename is correct.
- The size of the file sent can theoretically be ANY SIZE. All you would need is pass the right Formidable options. And of course have the initial storage and time to send the file. Server side. 
- Once sent the file will be deleted from the /uploads directory because it is assumed that the file sent from the frontend, once sent will be deleted from local storage.
- Instead it is stored in and can be retrieved from discord.
- I tried to keep it as simple as possible. It does not use express and does not use DiscordJS. I tried to keep dependencies to a minimum.
- The only notable one it uses being Formidable, as it was the only one I could rely on to safely send multipart/form-data.(10/10 personally, I tried a few others but Formidable was the best/safest)
- It uses Streams to both chunk and unchunk/compile the bigger files. I should probably have implemented some sort of concurrency measure though because the sending process is slow for bigger files.
- I also should have used some sort of database to store the filenames and message IDs/metadata instead of a .txt and .json file respectively. But that can be implemented later. And it works.
- I have not cleared the received_files.txt and messageIDs.json files, but I would suggest you do erase them clean once you look at their format.
- The chunk size is set to 24 MB but you can change it to 25 if you wish. That is the Discord filesize limit.

If you (the reader) plan to use this code, do ensure you correctly put the channel ID and bot token in their correct places (be it the variables or in options directly which I recommend for personal use).
The files you would need to go to(All of which are in the backend folder) are chunker.js, sender.js and retriever.js where the header options are used to make the requests. 
Other changes you can make are to reciever.js which initializes the Formidable form. In `const options`, change the maxFileSize as you see fit.
