require("dotenv").config();
const fs = require("node:fs/promises");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const libre = require("libreoffice-convert");
libre.convertAsync = require("util").promisify(libre.convert);

// MIDDLEWARES
const { authenticateToken } = require("./middlewares/auth");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    optionsSuccessStatus: 200,
  })
);

const upload = multer({ dest: "uploads/" });

async function convertToPDF(docxFilePath, pdfFilePath) {
  // leggo il file docx
  const fileDocx = await fs.readFile(docxFilePath);
  // converto il file in PDF
  const pdfBuf = await libre.convertAsync(fileDocx, ".pdf", undefined);
  // salvo il file PDF
  await fs.writeFile(pdfFilePath, pdfBuf);
}

// http://localhost/converter/upload
// form-data
app.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    // recuperare il file docx e il suo nome dalla request
    const { originalname, path: uploadedFilePath } = req.file;
    try {
      const filename = originalname.split(".").slice(0, -1).join(".");
      // creare un percorso per file PDF
      const pdfPath = `${__dirname}/uploads/${filename}.pdf`;
      // eseguiamo la conversione del file PDF
      await convertToPDF(uploadedFilePath, pdfPath);
      // restituisco il path al file pdf
      res.json({
        link: `/download/${filename}.pdf`,
        filename,
      });
    } catch (error) {
      res.status(500).json("Errore durante la conversione del file");
    } finally {
      // cancelliamo il file temporaneo docx
      await fs.unlink(uploadedFilePath);
    }
  }
);

// http://localhost/converter/download/Test.pdf
app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = `${__dirname}/uploads/${filename}`;
  res.sendFile(filePath);
});

app.listen(process.env.SERVER_PORT, () => {
  console.log("Converter Service is running", process.env.SERVER_PORT);
});
