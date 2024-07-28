const { readCSV, readExcel, dataProcessing, senitizedKey, updateCsv, updateExcel } = require("./utils");

// service for further processing on csv file
exports.processCSV = async (fileName) => {
  try {
    const data = await readCSV(fileName);
    return await dataProcessing(senitizedKey(data), fileName, true);
  } catch (error) {
    throw error;
  }
};

// service for further processing on excel file
exports.processExcel = async (fileName) => {
  try {
    const data = await readExcel(fileName);
    return await dataProcessing(senitizedKey(data), fileName, false);
  } catch (error) {
    throw error;
  }
};

// service for update invoice number
exports.updateInvoiceNumber = async (
  fileName,
  invoiceNumber,
  isCSV = false
) => {
  try {
    let data;
    let success = true;
    let errorMessage = [];
    const updateArray = [];
    if (isCSV) {
      data = await readCSV(fileName);
    } else {
      data = await readExcel(fileName);
    }
    if (Array.isArray(data) && data.length > 0) {
      if (!("Invoice Number" in senitizedKey(data)[0])) {
        success = false;
        errorMessage.push({ error: "Invoice Number field not found in file" });
      } else {
        for (const [index, item] of senitizedKey(data).entries()) {
          if (
            !Number(item["Invoice Number"]) ||
            Number(item["Invoice Number"]) !== invoiceNumber
          ) {
            updateArray.push({ field: "Invoice Number", value: invoiceNumber, index });
          }
        }
      }
    } else {
      sucess = false;
      errorMessage.push({ error: "Data not found in file" });
    }

    if(success) {
      if(updateArray.length > 0) {
        if(isCSV) {
          await updateCsv(`uploads/${fileName}`,`uploads/${fileName}`, null, updateArray )
        } else {
          await updateExcel(`uploads/${fileName}`,`uploads/${fileName}`, null, updateArray )
        }
      }
    }
    return { success, errorMessage };
  } catch (error) {
    throw error;
  }
};
