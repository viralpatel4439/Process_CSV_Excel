require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { processCSV, processExcel, updateInvoiceNumber } = require("./service");
const path = require('path');
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors());

// Request for single file processing
app.post(
  "/fileProcessing",
  upload.single("processing_file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(404).json({
          success: false,
          errorMessage: "file is required",
        });
      const fileExtention = req.file.originalname.split(".");
      if (fileExtention[fileExtention.length - 1] === "csv") {
        const result = await processCSV(req.file.filename);
        if (result.success) {
          return res
            .status(200)
            .json({ success: result.success, data: result.processedData });
        }
        return res.status(400).json({
          success: result.success,
          errorMessage: result.errorMessage.map((item) => ({
            error: item.error,
          })),
        });
      } else if (fileExtention[fileExtention.length - 1] === "xlsx") {
        const result = await processExcel(req.file.filename);
        if (result.success) {
          return res
            .status(200)
            .json({ success: result.success, data: result.processedData });
        }
        return res.status(400).json({
          success: result.success,
          errorMessage: result.errorMessage.map((item) => ({
            error: item.error,
          })),
        });
      } else {
        return res.status(400).json({
          success: false,
          errorMessage: "File must be in csv or xlsx",
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.toString() });
    }
  }
);

// Request for multiple file processing
app.post(
  "/batchFileProcessing",
  upload.array("processing_file", 10),
  async (req, res) => {
    try {
      if (!req.files)
        return res.status(404).json({
          success: false,
          errorMessage:
            "files are required and you can upload maximum 10 files",
        });
      const returnData = [];
      for await (const item of req.files) {
        const fileExtention = item.originalname.split(".");
        if (fileExtention[fileExtention.length - 1] === "csv") {
          const result = await processCSV(item.filename);
          if (result.success) {
            returnData.push({
              success: result.success,
              data: result.processedData,
              fileName: item.originalname,
            });
          } else {
            returnData.push({
              success: result.success,
              errorMessage: result.errorMessage.map((item) => ({
                error: item.error,
              })),
              fileName: item.originalname,
            });
          }
        } else if (fileExtention[fileExtention.length - 1] === "xlsx") {
          const result = await processExcel(item.filename);
          if (result.success) {
            returnData.push({
              success: result.success,
              data: result.processedData,
              fileName: item.originalname,
            });
          } else {
            returnData.push({
              success: result.success,
              errorMessage: result.errorMessage.map((item) => ({
                error: item.error,
              })),
              fileName: item.originalname,
            });
          }
        } else {
          returnData.push({
            success: false,
            errorMessage: "File must be in csv or xlsx",
            fileName: item.originalname,
          });
        }
      }
      return res.status(200).json({ success: true, data: returnData });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.toString() });
    }
  }
);

// Request for update invoice number
app.patch(
  "/updateInviceNumber",
  upload.single("processing_file"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(404).json({
          success: false,
          errorMessage: "file is required",
        });
      const { invoiceNumber } = req.body;
      if (!invoiceNumber || (invoiceNumber && !Number(invoiceNumber))) {
        return res.status(404).json({
          success: false,
          errorMessage: "invoice number is required and it must be in number",
        });
      }
      let data;
      const fileExtention = req.file.originalname.split(".");
      if (fileExtention[fileExtention.length - 1] === "csv") {
        data = await updateInvoiceNumber(
          req.file.filename,
          invoiceNumber,
          true
        );
      } else if (fileExtention[fileExtention.length - 1] === "xlsx") {
        data = await updateInvoiceNumber(
          req.file.filename,
          invoiceNumber,
          false
        );
      } else {
        return res.status(400).json({
          success: false,
          errorMessage: "File must be in csv or xlsx",
        });
      }
      
      if (data.success) {
        const filePath = path.join(__dirname, `./uploads/${req.file.filename}`);
        return res.status(200).sendFile(filePath, (err) => {
          if (err) {
            console.error("Send file error:", err);
            res.status(500).json({ error: "Send file error" });
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          errorMessage: data.errorMessage,
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.toString() });
    }
  }
);

app.listen(process.env.PORT || 8000, () => {
  console.log("Server is working on 8000 port");
});
