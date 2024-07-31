const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { encode } = require("blurhash");

const sliderDir = path.join(__dirname, "slider");
const outputFile = path.join(__dirname, "data.js"); // Çıktı dosyasının yolu

// Resimden BlurHash hesaplamak için bir yardımcı fonksiyon
async function getBlurHash(imagePath) {
  try {
    const image = sharp(imagePath);
    const { data, info } = await image
      .resize(200, 200) // Resmi yeniden boyutlandırarak performansı artırabilirsiniz
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const expectedLength = width * height * 4; // RGBA formatı için veri uzunluğu

    // Raw veri boyutunu kontrol et
    if (expectedLength !== data.length) {
      throw new Error(
        `Width (${width}) and height (${height}) do not match the pixels array length (${data.length}). Expected length: ${expectedLength}.`
      );
    }

    // 4x3 BlurHash için encode işlemi
    return encode(data, width, height, 4, 3);
  } catch (err) {
    throw new Error(
      `Failed to process image ${path.basename(imagePath)}: ${err.message}`
    );
  }
}

// Klasördeki tüm resimleri okuyun ve hashlerini hesaplayın
async function generateBlurHashes(directory) {
  const files = fs.readdirSync(directory);
  const images = [];

  for (const file of files) {
    const filePath = path.join(directory, file);
    try {
      const hash = await getBlurHash(filePath);
      const url = `/${file}`; // URL formatını ayarlayın, burada dosya ismi ile bir URL oluşturuluyor
      images.push({
        id: images.length + 1, // ID'yi dizinin uzunluğuna göre ayarlıyoruz
        url,
        title: path.basename(file, path.extname(file)), // Başlık olarak dosya ismini kullanabilirsiniz
        description: `Description for ${file}`, // Bu kısmı kendi açıklamanızla doldurabilirsiniz
        hash,
      });
    } catch (err) {
      console.error(`Error processing file ${file}: ${err.message}`);
    }
  }

  return images;
}

generateBlurHashes(sliderDir)
  .then((images) => {
    // Çıktıyı data.js formatında yazma
    const output = `export const images = ${JSON.stringify(images, null, 2)};`;
    fs.writeFileSync(outputFile, output);
    console.log("Data written to", outputFile);
  })
  .catch((err) => {
    console.error(err);
  });
