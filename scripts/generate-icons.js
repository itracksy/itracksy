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
  const iconsForIco = await Promise.all(
    sizes.map(async (size) => {
      const buffer = await sharp(inputFile)
        .resize(size, size)
        .toBuffer();
      return { input: buffer, size };
    })
  );

  await sharp(inputFile)
    .resize(256, 256)
    .toFile(path.join(outputDir, 'icon.ico'));
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
