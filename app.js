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


app.get("/display", async (req, res) => {
    try {
        const viewexpense = await SchemeExpenses.find({});
        
        res.send(viewexpense);
    } catch (e) {
        res.status(400).send(e.message);
    }
});



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

const validCurrencies = ["USD", "EUR", "GBP", "INR"];

async function convertToINR(amount, fromCurrency) {
    
    const API_URL = 'https://v6.exchangerate-api.com/v6/015b1eed9c8af4b1c90b2c53/latest/USD'; 
    const response = await axios.get(API_URL);
    
    const conversionRates = response.data.rates;
    
    if (validCurrencies.includes(fromCurrency) && conversionRates[fromCurrency]) {
        // Convert the amount to INR using the fetched conversion rate
        const inrAmount = amount * conversionRates[fromCurrency];
        return { amount: inrAmount, currency: 'INR' };
    } else {
        throw new Error(`Invalid or unsupported currency: ${fromCurrency}`);
    }
}

app.post("/upload", upload.single("sheet"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const csvBuffer = req.file.buffer.toString();
        const jsonArray = await csvtojson().fromString(csvBuffer);

        // Validate and store each row in MongoDB
        for (const row of jsonArray) {
            // Convert date format (assuming your date field is named "Date")
            if (row.Date) {
                const [day, month, year] = row.Date.split("-");
                const formattedDate = `${year}-${month}-${day}`;
                row.Date = new Date(formattedDate);
            }

            // Convert currency to INR
            if (row.Currency && !validCurrencies.includes(row.Currency.toUpperCase())) {
                const inrConversion = await convertToINR(row.Amount, row.Currency.toUpperCase());
                row.Amount = inrConversion.amount;
                row.Currency = inrConversion.currency;
            }

            const addExpense = new SchemeExpenses(row);
            await addExpense.save();
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
