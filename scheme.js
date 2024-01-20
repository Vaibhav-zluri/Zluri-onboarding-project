const mongoose = require("mongoose");

const validCurrencies = ["USD", "EUR", "GBP", "INR"]; // Add more currencies as needed

const expensescheme = new mongoose.Schema({
    Date: {
        type: Date,
        required: true,
        validate: {
            validator: function (date) {
                return date <= new Date();
            },
            message: "Date must be less than or equal to the current date"
        }
    },
    Description: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        required: true,
        validate: {
            validator: function (amount) {
                return amount >= 0;
            },
            message: "Amount must not be less than zero"
        }
    },
    Currency: {
        type: String,
        default: "USD",
        validate: {
            validator: function (currency) {
                return validCurrencies.includes(currency.toUpperCase()); // Case-insensitive check
            },
            message: "Invalid currency"
        }
    },
});

// Add a pre-save hook to format the date before saving to the database


const SchemeExpenses = mongoose.model("Expensecollection", expensescheme);

module.exports = SchemeExpenses;
