import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
const inputSvg = path.join(__dirname, '../logo.svg');
const outputDir = path.join(__dirname, '../resources');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert SVG to PNG at specific size
async function svgToPng(size, outputPath) {
  await sharp(inputSvg, { density: 300 }) // High DPI for better quality
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      force: true
    })
    .toFile(outputPath);
}

// Generate PNG icons from SVG
async function generatePngIcons() {
  console.log('📐 Generating PNG icons from SVG...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon_${size}x${size}.png`);
    await svgToPng(size, outputPath);
    console.log(`  ✓ Generated icon_${size}x${size}.png`);
  }

  // Also create the main icon.png
  const mainIconPath = path.join(outputDir, 'icon.png');
  await svgToPng(1024, mainIconPath);
  console.log(`  ✓ Generated icon.png (1024x1024)`);

  // Copy to root for reference
  const rootLogoPath = path.join(__dirname, '../logo.png');
  fs.copyFileSync(mainIconPath, rootLogoPath);
  console.log(`  ✓ Copied to logo.png`);
}

// Generate ICO file (Windows)
async function generateIcoFile() {
  try {
    console.log('\n🪟 Creating Windows .ico file...');

    // Use existing PNG files
    const pngFiles = [];
    for (const size of [16, 32, 48, 64, 128, 256]) {
      const pngPath = path.join(outputDir, `icon_${size}x${size}.png`);
      if (fs.existsSync(pngPath)) {
        pngFiles.push(pngPath);
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
    console.log(`  ✅ Successfully created .ico file`);
  } catch (error) {
    console.error('  ❌ Error creating .ico file:', error.message);
    throw error;
  }
}

// Generate ICNS file (macOS) using iconutil
async function generateIcnsFile() {
  try {
    console.log('\n🍎 Creating macOS .icns file...');

    // Create iconset directory
    const iconsetDir = path.join(outputDir, 'icon.iconset');
    if (fs.existsSync(iconsetDir)) {
      fs.rmSync(iconsetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(iconsetDir, { recursive: true });

    // Define iconset sizes (macOS specific naming)
    const iconsetSizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' }
    ];

    // Generate each iconset file directly from SVG
    for (const { size, name } of iconsetSizes) {
      const destPath = path.join(iconsetDir, name);
      await svgToPng(size, destPath);
      console.log(`  ✓ Generated ${name}`);
    }

    // Use iconutil to create ICNS (macOS only)
    if (process.platform === 'darwin') {
      const icnsPath = path.join(outputDir, 'icon.icns');
      try {
        await execAsync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
        console.log(`  ✅ Successfully created .icns file`);

        // Clean up iconset directory
        fs.rmSync(iconsetDir, { recursive: true, force: true });
        console.log(`  ✓ Cleaned up temporary iconset directory`);
      } catch (iconutilError) {
        console.log(`  ⚠️  iconutil failed, keeping iconset directory for manual conversion`);
        console.log(`  💡 You can manually convert using: iconutil -c icns "${iconsetDir}"`);
      }
    } else {
      console.log('  ⚠️  Skipping .icns generation (iconutil only available on macOS)');
      console.log('     The iconset directory has been created for manual conversion');
    }
  } catch (error) {
    console.error('  ❌ Error creating .icns file:', error.message);
    console.log('  ℹ️  The PNG icons are still usable for macOS builds');
  }
}

async function main() {
  try {
    console.log('🚀 Converting SVG logo to app icons...\n');
    console.log(`📄 Source: ${inputSvg}`);
    console.log(`📁 Output: ${outputDir}\n`);

    // Check if SVG exists
    if (!fs.existsSync(inputSvg)) {
      throw new Error(`SVG file not found: ${inputSvg}`);
    }

    await generatePngIcons();
    await generateIcoFile();
    await generateIcnsFile();

    console.log('\n✨ All icons generated successfully from SVG!');
    console.log('\n📋 Generated files:');
    console.log('   • PNG icons (16x16 to 1024x1024)');
    console.log('   • Windows ICO file');
    console.log('   • macOS ICNS file (if on macOS)');
    console.log('\n🎉 Your app now has vector-quality icons!');

  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

main();





