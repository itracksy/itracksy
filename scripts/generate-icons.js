const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
const inputFile = path.join(__dirname, '../resources/icon.png');
const outputDir = path.join(__dirname, '../resources');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNG icons
async function generatePngIcons() {
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon_${size}x${size}.png`));
  }
}

// Generate ICO file (Windows)
async function generateIcoFile() {
  try {
    console.log('Creating Windows .ico file...');
    const pngToIco = require('png-to-ico');
    
    // Use existing PNG files rather than generating new ones
    const pngFiles = [];
    for (const size of [16, 32, 48, 64, 128, 256]) {
      const pngPath = path.join(outputDir, `icon_${size}x${size}.png`);
      if (fs.existsSync(pngPath)) {
        pngFiles.push(pngPath);
        console.log(`Found existing PNG: ${pngPath}`);
      }
    }
    
    if (pngFiles.length === 0) {
      throw new Error('No PNG files found for generating ICO');
    }
    
    // Generate the ICO file with multiple resolutions
    const buf = await pngToIco(pngFiles);
    
    // Save the ICO file
    const icoPath = path.join(outputDir, 'icon.ico');
    fs.writeFileSync(icoPath, buf);
    console.log(`Successfully created .ico file at: ${icoPath}`);
  } catch (error) {
    console.error('Error creating .ico file:', error);
    throw error;
  }
}

// Generate ICNS file (macOS)
async function generateIcnsFile() {
  await sharp(inputFile)
    .resize(1024, 1024)
    .toFile(path.join(outputDir, 'icon.icns'));
}

async function main() {
  try {
    await generatePngIcons();
    await generateIcoFile();
    await generateIcnsFile();
    console.log('Icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

main();
