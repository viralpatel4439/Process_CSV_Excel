# Process_CSV_Excel

This project includes three APIs that help you fetch data from Excel or CSV files with several validation checks.

    1.Required fields.

        -> If any of the following fields are not present in the CSV or Excel, the program will terminate and return an error:

            1. Invoice Number
            2. Date
            3. Customer Name
            4. Total Amount
            5. Item Description
            6. Item Quantity
            7. Item Price
            8. Item Total

    2.Date format.

        -> Validates the correctness of the date format. If there is an issue with the date, the error will be written to the file on the respective row.

    3.Numeric values.

        -> Validates that the following fields contain numeric values. If not, the error will be written to the file on the respective row:

            1. Invoice Number
            2. Total Amount
            3. Item Quantity
            4. Item Price
            5. Item Total

    4.Unique Invoice Numbers.

        -> Assumes that each CSV or Excel file contains a single multi-line invoice. If another invoice number is found in the same file, an error will be written to the file on the respective row.

        -> Successfully processed invoice numbers are stored in a JSON file. If a duplicate invoice number (one already processed) is encountered, the program will terminate and return an error.

The code includes exception handling and logging for the main functions. There is also a sample .env file available for local setup and test cases for validation.

### Backend Project

Starting the Backend Project

    1. Navigate to the backend project directory
        -> cd backend-project

    2. Install dependencies
        -> npm install

    3. Set up the environment variables by copying and editing the example file 
        -> cp .env.sample .env

    4. Start the backend server 
        -> npm start

Running Test Cases

    1. Navigate to the backend project directory 
        -> cd backend-project

    2. Install dependencies 
        -> npm i

    3. Run the tests 
        -> npm test 

### Frontend Project

Starting the Frontend Project

    1. Navigate to the frontend project directory 
        -> cd frontend-project
    
    2. Install dependencies 
        -> npm install
    
    3. Set up the environment variables by copying and editing the example file 
        -> cp .env.sample .env

    4. Start the frontend server 
        -> npm run dev

### Backend Project API

    1. Process Single CSV or Excel File
        -> METHOD: POST

        -> API: `{Backend-endpoint}/fileProcessing`
        
        -> Payload: 
            { 
                processing_file: (Required , except single file)
            }

        -> This API processes a single file with the mentioned validations, error handling, and logging.

    2. Process Multiple Files or Batch Processing

        -> METHOD: POST

        -> API: `{Backend-endpoint}/batchFileProcessing`
        
        -> Payload: 
            { 
                processing_file: (Required , except multiple files, maximum capacity is 10 files)
            }

        -> This API processes multiple files or batch processing with the mentioned validations, error handling, and logging.

    3. This API is used for update invoice number into csv or excel file

        -> METHOD: PATCH

        -> API: `{Backend-endpoint}/updateInviceNumber`
        
        -> Payload: 
            { 
                processing_file: (Required , except single file),
                invoiceNumber: (Required, number)
            }

        -> This API updates the invoice number in a CSV or Excel file and returns the updated file.

        -> The file must contain the Invoice Number field to update the invoice number; otherwise, it will return an error.

### Docker Setup
    
    This project is having docker setup so if you want to run this project through docker then below is the commands for it

    1. Starting the Docker Container
        
        -> docker-compose up -d

    2. Stopping the Docker Container

        -> docker-compose down