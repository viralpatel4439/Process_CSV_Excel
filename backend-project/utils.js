const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const { createObjectCsvWriter } = require("csv-writer");

// Required fields
const requiredKeys = [
  "Invoice Number",
  "Date",
  "Customer Name",
  "Total Amount",
  "Item Description",
  "Item Quantity",
  "Item Price",
  "Item Total",
];

// Function to convert Excel serial date to JavaScript Date object
exports.convertExcelDate = (serial) => {
  // Constants
  const SECONDS_IN_DAY = 86400;
  const EXCEL_EPOCH_DIFF = 25569; // Excel epoch starts on December 30, 1899

  // Calculate days and fraction of the day
  const utcDays = Math.floor(serial - EXCEL_EPOCH_DIFF);
  const fractionalDay = serial - Math.floor(serial) + 0.0000001;

  // Convert to milliseconds
  const utcValue = utcDays * SECONDS_IN_DAY * 1000;
  const dateInfo = new Date(utcValue);

  // Convert fractional day to time
  const totalSeconds = Math.floor(SECONDS_IN_DAY * fractionalDay);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / (60 * 60));

  // Return the final Date object
  return new Date(
    dateInfo.getFullYear(),
    dateInfo.getMonth(),
    dateInfo.getDate(),
    hours,
    minutes,
    seconds
  );
};

// Function to format Date object to yyyy-mm-dd
exports.formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`;
};

// read data key senitized
exports.senitizedKey = (data) => {
  return data.map((item) => {
    const trimmedItem = {};
    for (const key in item) {
      const trimmedKey = key.trim();
      trimmedItem[trimmedKey] = item[key];
    }
    return trimmedItem;
  });
};

// read csv file and return data from it
exports.readCSV = (fileName) => {
  return new Promise((resolve, reject) => {
    try {
      const results = [];

      fs.createReadStream(`uploads/${fileName}`)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          console.log("CSV file successfully read");
          resolve(results);
        })
        .on("error", (error) => reject(error));
    } catch (error) {
      reject(error);
    }
  });
};

// Function to update CSV file
exports.updateCsv = (
  inputFilePath,
  outputFilePath,
  errorMessage,
  updateArray
) => {
  return new Promise((resolve, reject) => {
    try {
      const rows = [];
      let headers = [];

      // Read the CSV file
      fs.createReadStream(inputFilePath)
        .pipe(csv())
        .on("headers", (headerList) => {
          headers = headerList;
          if (errorMessage) {
            if (!headers.includes("Error")) {
              headers.push("Error");
            }
          }
        })
        .on("error", (error) => reject(error))
        .on("data", (row) => {
          rows.push(row);
        })
        .on("end", () => {
          if (errorMessage) {
            errorMessage.forEach((item) => {
              // Update the specified row with the error message
              if (item.index < rows.length) {
                rows[item.index]["Error"] = item.error;
              } else {
                console.error("Row index out of bounds");
                return;
              }
            });
          }
          if (updateArray) {
            updateArray.forEach((item) => {
              let key = "";
              for (const element of Object.keys(rows[0])) {
                if (element.trim() === item.field) {
                  key = element;
                  break;
                }
              }
              if (key) {
                // Update the specified row
                if (item.index < rows.length) {
                  rows[item.index][key] = item.value.toString();
                } else {
                  console.error("Row index out of bounds");
                  return;
                }
              }
            });
          }

          // Write the updated CSV file
          const csvWriter = createObjectCsvWriter({
            path: outputFilePath,
            header: headers.map((header) => ({ id: header, title: header })),
          });

          csvWriter
            .writeRecords(rows)
            .then(() => {
              console.log("CSV file updated successfully");
              resolve(true);
            })
            .catch((err) => reject(err));
        });
    } catch (err) {
      reject(err);
    }
  });
};

// Function to update the Excel file
exports.updateExcel = (
  inputFilePath,
  outputFilePath,
  errorMessage,
  updateArray
) => {
  return new Promise((resolve, reject) => {
    try {
      // Load the workbook
      const workbook = xlsx.readFile(inputFilePath);

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert the worksheet to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      if (errorMessage) {
        // Check if the "Error" column exists and add it if necessary
        if (jsonData.length > 0 && !("Error" in jsonData[0])) {
          jsonData.forEach((row) => {
            row.Error = row.Error || ""; // Initialize the Error column if it does not exist
          });
        }
      }

      if (errorMessage) {
        errorMessage.forEach((item) => {
          // Update the specified row with the error message
          if (item.index < jsonData.length) {
            jsonData[item.index]["Error"] = item.error;
          } else {
            console.error("Row index out of bounds");
            return;
          }
        });
      }

      if (updateArray) {
        updateArray.forEach((item) => {
          // Update the specified row
          if (item.index < jsonData.length) {
            jsonData[item.index][item.field] = item.value;
          } else {
            console.error("Row index out of bounds");
            return;
          }
        });
      }

      // Convert JSON back to worksheet
      const updatedWorksheet = xlsx.utils.json_to_sheet(jsonData);

      // Add the updated worksheet back to the workbook
      workbook.Sheets[sheetName] = updatedWorksheet;

      // Write the updated workbook
      xlsx.writeFile(workbook, outputFilePath);

      resolve("Excel file updated successfully");
    } catch (error) {
      reject(error);
    }
  });
};

// read excel file and return data from it
exports.readExcel = (fileName) => {
  return new Promise((resolve, reject) => {
    try {
      // Load the workbook
      const workbook = xlsx.readFile(`uploads/${fileName}`);

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert the worksheet to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet);

      // Convert Excel dates to formatted date strings
      const convertedData = jsonData.map((row) => {
        if ("Date" in row && row.Date) {
          const date = this.convertExcelDate(row.Date);
          row.Date = this.formatDate(date);
        }
        return row;
      });
      console.log("Excel file successfully read");
      resolve(convertedData);
    } catch (error) {
      reject(error);
    }
  });
};

// validate date
exports.isValidDate = (dateStr) => {
  const splitData = dateStr.split("-");
  if (splitData.length !== 3) return false;
  const newDate = `${splitData[2]}-${splitData[1]}-${splitData[0]}`;
  const date = new Date(newDate);
  return (
    date instanceof Date &&
    !isNaN(date) &&
    newDate === date.toISOString().split("T")[0]
  );
};

// check field validation, Date validation, number validation
exports.checkValidation = (item) => {
  try {
    // Field Validation
    const allKeysExist = requiredKeys.every((key) => key in item);
    if (!allKeysExist) {
      const missingKeys = requiredKeys.filter((key) => !(key in item));
      const status = false;
      const errorMessage = `Missing fields: ${missingKeys.join(", ")}`;
      return { status, error: errorMessage, fieldsNotFound: true };
    }

    // Date Validation
    if (!this.isValidDate(item["Date"])) {
      const status = false;
      const errorMessage = "Date format is incorrect.";
      return { status, error: errorMessage, fieldsNotFound: false };
    }

    // Number Validation
    const numericKeys = [
      "Invoice Number",
      "Total Amount",
      "Item Quantity",
      "Item Price",
      "Item Total",
    ];
    const invalidNumericKeys = numericKeys.filter(
      (key) => !(Number(item[key]) ? true : false)
    );

    if (invalidNumericKeys.length !== 0) {
      const status = false;
      const errorMessage = `Invalid numeric values: ${invalidNumericKeys.join(
        ", "
      )}`;
      return { status, error: errorMessage, fieldsNotFound: false };
    }

    return { status: true, error: "", fieldsNotFound: false };
  } catch (error) {
    throw error;
  }
};

exports.writeJsonFile = (data) => {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile("processedData.json", JSON.stringify(data), (error) => {
        if (error) reject(error);
        console.log("processData file has been written successfully");
        resolve(true);
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.readJsonFile = () => {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile("processedData.json", "utf8", (err, data) => {
        if (err) reject(err);
        resolve(JSON.parse(data));
      });
    } catch (err) {
      reject(err);
    }
  });
};

// data processing of single csv
exports.dataProcessing = async (data, fileName, isCSV = false) => {
  try {
    let success = true;
    let processedData = {};
    const errorMessage = [];
    let field;
    const jsonData = await this.readJsonFile();

    for await (const [index, item] of data.entries()) {
      const { status, error, fieldsNotFound } = this.checkValidation(item);
      if (!status) {
        success = status;
        errorMessage.push({ status: false, error: error, index });
        field = fieldsNotFound;
        if (fieldsNotFound) {
          break;
        }
      } else {
        if (
          jsonData.processedInvoiceNumber.includes(
            Number(item["Invoice Number"])
          )
        ) {
          success = false;
          field = false;
          errorMessage.push({
            status: false,
            error: "Invoice Number already processed",
            index,
          });
          break;
        }
        if (Object.keys(processedData).length < 1) {
          // assign first time data to the object
          Object.assign(processedData, {
            "Invoice Number": Number(item["Invoice Number"]),
            Date: item["Date"].split("-").reverse().join("-"),
            "Customer Name": item["Customer Name"],
            "Total Amount": Number(item["Total Amount"]),
            item: [
              {
                "Item Description": item["Item Description"],
                "Item Quantity": Number(item["Item Quantity"]),
                "Item Price": Number(item["Item Price"]),
                "Item Total": Number(item["Item Total"]),
              },
            ],
          });
        } else {
          // unique invoice number validation from single csv
          if (
            Number(item["Invoice Number"]) !== processedData["Invoice Number"]
          ) {
            success = false;
            field = fieldsNotFound;
            errorMessage.push({
              status: false,
              error: "Invoice number must be unique",
              index,
            });
          } else {
            processedData["item"].push({
              "Item Description": item["Item Description"],
              "Item Quantity": Number(item["Item Quantity"]),
              "Item Price": Number(item["Item Price"]),
              "Item Total": Number(item["Item Total"]),
            });
          }
        }
      }
    }
    if (!success) {
      if (!field) {
        if (isCSV) {
          await this.updateCsv(
            `uploads/${fileName}`,
            `uploads/${fileName}`,
            errorMessage
          );
        } else {
          await this.updateExcel(
            `uploads/${fileName}`,
            `uploads/${fileName}`,
            errorMessage
          );
        }
      }
    }

    if (success) {
      jsonData.processedInvoiceNumber.push(processedData["Invoice Number"]);
      await this.writeJsonFile(jsonData);
    }

    return {
      success,
      processedData,
      errorMessage,
    };
  } catch (error) {
    throw error;
  }
};
