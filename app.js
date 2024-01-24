const express = require("express");
const csvtojson = require("csvtojson");
const multer = require("multer");
const fs = require("fs");
require("./conne");
const SchemeExpenses = require("./scheme");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", async (req, res) => {
    res.send("Hello from Vaibhav");
});

app.post("/add", async (req, res) => {
    try {
        const addexpense = new SchemeExpenses(req.body);
        console.log(req.body);
        await addexpense.save();
        res.send("Expense added successfully");
    } catch (e) {
        res.status(400).send(e.message);
    }
});

const ITEMS_PER_PAGE = 10; 

app.get("/display", async (req, res) => {
    try {
       
        const page = parseInt(req.query.page) || 1; 
        const pageSize = parseInt(req.query.pageSize) || ITEMS_PER_PAGE;

        const skip = (page - 1) * pageSize;

        const viewexpense = await SchemeExpenses.find({})
            .skip(skip)
            .limit(pageSize);

        res.send(viewexpense);
    } catch (e) {
        res.status(500).send(e.message);
    }
});
// const ITEMS_PER_PAGE = 10;

// app.get("/display", async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const pageSize = parseInt(req.query.pageSize) || ITEMS_PER_PAGE;

//         const skip = (page - 1) * pageSize;

//         const viewexpense = await SchemeExpenses.find({})
//             .skip(skip)
//             .limit(pageSize);

        
//         const displayData = viewexpense.map(async (row) => {
//             const displayRow = {
//                 OriginalAmount: row.Amount,
//                 OriginalCurrency: row.Currency,
//                 Date: row.Date,
//                 Description: row.Description,
//                 ConvertedAmount: 0,
//                 ConvertedCurrency: 'INR',
//             };

//             if (row.Currency && row.Currency !== 'INR') {
//                 const conversion = await convertToINR(row.Amount, row.Currency);
//                 displayRow.ConvertedAmount = conversion.amount;
//                 displayRow.ConvertedCurrency = conversion.currency;
//             } else {
                
//                 displayRow.ConvertedAmount = row.Amount;
//             }

//             return displayRow;
//         });

//         const convertedData = await Promise.all(displayData);
//         res.send(convertedData);
//     } catch (e) {
//         res.status(500).send(e.message);
//     }
// });



app.patch("/update/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const updateexpense = await SchemeExpenses.findByIdAndUpdate(_id, req.body, { new: true });

        res.send(updateexpense);
    } catch (e) {
        res.status(400).send(e);
    }
});

app.delete("/delete/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        const deleteexpense = await SchemeExpenses.findByIdAndDelete(_id);

        res.send(deleteexpense);
    } catch (e) {
        res.status(400).send(e);
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const axios = require('axios'); 


async function convertToINR(amount, fromCurrency) {    

    const API_URL = 'https://v6.exchangerate-api.com/v6/015b1eed9c8af4b1c90b2c53/latest/INR';
    const response = await axios.get(API_URL);

    const conversionRates = response.data.conversion_rates;
    

    if (conversionRates[fromCurrency]) {
        const inrAmount = amount / conversionRates[fromCurrency];
        return { amount: inrAmount, currency: 'INR' };
    } else {
        return { amount: amount, currency: 'invalid' };
        
    }
}

const moment = require('moment');

function convertToDate(inputDate) {
    
    const date = moment(inputDate, [
        moment.ISO_8601,  
        'MM/DD/YYYY',     
        'YYYY-MM-DD', 
        'DD-MM-YYYY'
    ], true); 
   
    if (date.isValid()) {
        return date.toDate();
    }   
    return new Date('invalid');
}



app.post("/upload", upload.single("sheet"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const csvBuffer = req.file.buffer.toString();
        const jsonArray = await csvtojson().fromString(csvBuffer);

        for (const row of jsonArray) {
            row.Currency=row.Currency.toUpperCase()
            if (row.Currency !='INR') {
                
                const inrConversion = await convertToINR(row.Amount, row.Currency);
                row.Amount = inrConversion.amount;
                 
                row.Currency = inrConversion.currency;
                
            }

            // if (row.Date) {
                const formattedDate = convertToDate(row.Date);

                if (formattedDate !== 'Invalid Date') {
                    row.Date = new Date(formattedDate);

                    if (row.Currency !== 'invalid' && row.Amount>=0 && row.Date <= new Date()) {
                        const addExpense = new SchemeExpenses(row);
                        await addExpense.save();
                    } else {
                        console.log(`Skipping row with invalid currency or amount or future date: ${JSON.stringify(row)}`);
                    }
                } 
                // else {
                //     console.log(`Skipping row with invalid date format: ${JSON.stringify(row)}`);
                // }
        //     }
         }

        res.send("CSV data uploaded and stored in MongoDB");
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});


app.listen(port, () => {
    console.log(`Connection is live at port no. ${port}`);
});
