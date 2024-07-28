const { readJsonFile, writeJsonFile } = require("../utils");
const { processCSV } = require("../service");

const cleanUpData = async () => {
  const jsonData = await readJsonFile();
  const removeArray = [1,2]
  jsonData.processedInvoiceNumber =
    jsonData.processedInvoiceNumber.filter(
      (item) => !removeArray.includes(item)
    ) || [];

  await writeJsonFile(jsonData);
};

describe("test with valid data and invalid data", () => {
  afterAll(async () => {
    await cleanUpData();
  });

  it("process file data successfully", async () => {
    const exprectData = await processCSV("a519e498b08128edbaad616d57590a0d");
    expect(exprectData).toEqual({
      success: true,
      processedData: {
        "Invoice Number": 1,
        Date: "2024-04-08",
        "Customer Name": "Morgan Potter",
        "Total Amount": 640.39,
        item: [
          {
            "Item Description": "certainly",
            "Item Quantity": 8,
            "Item Price": 12.33,
            "Item Total": 98.64,
          },
          {
            "Item Description": "world",
            "Item Quantity": 8,
            "Item Price": 24.35,
            "Item Total": 194.8,
          },
          {
            "Item Description": "nature",
            "Item Quantity": 5,
            "Item Price": 69.39,
            "Item Total": 346.95,
          },
        ],
      },
      errorMessage: [],
    });
  });

  it("process file data is having problem", async () => {
    const exprectData = await processCSV("1f6153ea515150888ae9411b91833360");
    expect(exprectData).toEqual({
      errorMessage: [
        {
          error: "Invalid numeric values: Item Quantity",
          index: 0,
          status: false,
        },
      ],
      processedData: {
        "Customer Name": "Morgan Potter",
        Date: "2024-04-08",
        "Invoice Number": 2,
        "Total Amount": 640.39,
        item: [
          {
            'Item Description': 'world',
            'Item Quantity': 8,
            'Item Price': 24.35,
            'Item Total': 194.8
          },
          {
            'Item Description': 'nature',
            'Item Quantity': 5,
            'Item Price': 69.39,
            'Item Total': 346.95
          }
        ],
      },
      success: false,
    });
  });
});
