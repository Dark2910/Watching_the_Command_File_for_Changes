/* const fs = require('fs');

((filename) => new Promise((resolve, reject) => {
    const watcher = fs.watch(filename);

    watcher.on('change', (eventType, fileName) => {
        if(eventType === 'change') {
            resolve();
        }
    });

    watcher.on('error', (err) => {
        reject(err);
    });

}))('./command.txt')
    .then(() => {
        console.log('The file was changed.')
    })
    .catch((error) => {
        console.error('An error occurred:', error)
    }); */



const fs = require('fs/promises');

(async () => {
    try {
        // commands
        const CREATE_FILE = 'CREATE FILE';
        const DELETE_FILE = 'DELETE FILE';
        const RENAME_FILE = 'RENAME FILE';
        const ADD_TO_FILE = 'ADD TO THE FILE';


        const createFile = async (path) => {
            try {
                // we want to check whether or not we already have that file
                const existingFileHandle = await fs.open(path, 'r');
                existingFileHandle.close();
                // we already have that file...
                return console.log(`The file ${path} already exists.`);
            } catch (err) {
                // we do not have the file, now we should create it
                const newFileHandle = await fs.open(path, 'w');
                newFileHandle.close();
                console.log('A new file was successfully created.');
            }
        };

        const deleteFile = async (path) => {
            try {
                await fs.unlink(path);
                console.log('The file was successfully removed.');
            } catch (error) {
                if(error.code === 'ENOENT'){
                    console.log('No file at this path to remove.');
                } else {
                    console.log('An error ocurred while removing the file.');
                    console.log(error);
                }
            }
        };

        const renameFile = async (oldPath, newPath) => {
            try {
                await fs.rename(oldPath, newPath);
                console.log('The file was successfully renamed.');
            } catch (error) {
                console.log(error);
                if(error.code === 'ENOENT') {
                    console.log("No file at this path to rename, or the destination doesn't exist.");
                }else{
                    console.log('An error ocurred while renaming the file.');
                    console.log(error);
                }
            }
        };

        let addedContent;

        const addToFile = async (path, content) => {
            if(addedContent === content) return;
            try {
                const fileHandle = await fs.open(path, 'a');
                fileHandle.write(content);
                fileHandle.close();
                addedContent = content;
                console.log('The content was added successfully.');
            } catch (error) {
                console.log(error);
            }
        };

        const commandFileHandler = await fs.open('./command.txt', 'r');

        commandFileHandler.on('change', async () => {
            //Get the size of our file
            const {size} = await commandFileHandler.stat();
            //Allocate our buffer with the size of the file
            const buff = Buffer.alloc(size);
            //The location at which we want to start filling our buffer
            const offset = 0;
            //How many bytes we want to read
            const length = buff.byteLength;
            //The position that we want to start reading the file from
            const position = 0;

            //We always want to read the whole content (from beginning all the way to the end)
            await commandFileHandler.read(buff, offset, length, position);
            
            //Decoder 01 => meaningful
            //Encoder meaningful => 01

            const command = buff.toString('utf8');

            // create file:
            // CREATE FILE <path>
            if(command.includes(CREATE_FILE, 0)){
                const filePath = command.substring(CREATE_FILE.length + 1);
                createFile(filePath);
            };

            // delete file
            // DELETE FILE </path>
            if(command.includes(DELETE_FILE)){
                const filePath = command.substring(DELETE_FILE.length + 1);
                deleteFile(filePath);
            };

            // rename file
            // RENAME FILE </old-path> TO </new-path>
            if(command.includes(RENAME_FILE)) {
                const _idx = command.indexOf(' TO ');
                const oldPath = command.substring(RENAME_FILE.length + 1, _idx);
                const newPath = command.substring(_idx + 4);
                renameFile(oldPath, newPath);
            };

            // add to file
            // ADD TO THE FILE </path> THIS CONTENT: <content>
            if(command.includes(ADD_TO_FILE)){
                const _idx = command.indexOf(' THIS CONTENT: ');
                const filePath = command.substring(ADD_TO_FILE.length + 1, _idx);
                const content = command.substring(_idx + 15);
                addToFile(filePath, content);
            }
        }); 

        //Watch for changes on command.txt
        const watcher = fs.watch('./command.txt');
        for await (const event of watcher) {
            if (event.eventType === 'change') {
                commandFileHandler.emit('change')
            };
        };
    } catch (error) {
        console.error(`File command.txt does not found: ${error}`);
    }
})();



