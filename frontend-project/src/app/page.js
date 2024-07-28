"use client";
import { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState([]);
  const onFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      setMessage("You can only upload a maximum of 10 files");
    } else {
      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const onFileUpload = async () => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("processing_file", file);
    });
    try {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/batchFileProcessing`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (result.status === 200) {
        const data = await result.json();
        setMessage("File processed successfully");
        setFiles([]);
        setResult(data.data);
      }
    } catch (error) {
      setMessage("File upload failed", error);
    }
  };
  return (
    <div>
      <div>
        <h2>File Upload</h2>
        <input type="file" multiple onChange={onFileChange} />
        <button onClick={onFileUpload} disabled={files.length === 0}>
          Upload
        </button>
        <p>{message}</p>
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              {file.name}{" "}
              <button onClick={() => removeFile(index)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
      {result &&
        result.map((item) => (
          <div>
            <div>FileName :{item.fileName}</div>
            {item.success ? (
              <div>
                <div>Success: {item.success && "True"}</div>
                <div>Invoice Number: {item["data"]["Invoice Number"]}</div>
                <div>Date: {item["data"]["Date"]}</div>
                <div>Customer Name: {item["data"]["Customer Name"]}</div>
                <div>Total Amount: {item["data"]["Total Amount"]}</div>
                <div>
                  <table border={2}>
                    <tr>
                      <th>Item Description</th>
                      <th>Item Quantity</th>
                      <th>Item Price</th>
                      <th>Item Total</th>
                    </tr>
                    {item["data"]["item"] &&
                      item["data"]["item"].map((element) => (
                        <tr>
                          <td>{element["Item Description"]}</td>
                          <td>{element["Item Quantity"]}</td>
                          <td>{element["Item Price"]}</td>
                          <td>{element["Item Total"]}</td>
                        </tr>
                      ))}
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <div>Sucess: {!item.success && "False"}</div>
                {item.errorMessage &&
                  item.errorMessage.map((element) => (
                    <div>Error: {element.error}</div>
                  ))}
              </div>
            )}
            <div><br /></div>
          </div>
        ))}
    </div>
  );
}
