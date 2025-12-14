import fs from "fs";
export function createDirectory(directoryPath: string) {
  try {
    if (!fs.existsSync(directoryPath)) {
      // Check if directory exists
      fs.mkdirSync(directoryPath, { recursive: true }); // Create directory recursively
      console.log(`Directory created: ${directoryPath}`);
    } else {
      console.log(`Directory already exists: ${directoryPath}`);
    }
  } catch (err) {
    console.error(`Error creating directory ${directoryPath}:`, err);
    // You might want to exit the process if a critical directory cannot be created
    process.exit(1);
  }
}
