const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvFilePath = 'Singapore plan - Expenditure.csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// Split the content into lines
const lines = csvContent.split('\n');

// Get the header line and add new columns
const headerLine = lines[0];
const newHeaderLine = headerLine.trim() + ',location,lat,lng';

// Create new content with modified header
const newContent = [newHeaderLine, ...lines.slice(1)].join('\n');

// Write the modified content back to the file
fs.writeFileSync(csvFilePath, newContent, 'utf8');

console.log('CSV file has been modified successfully with new headers.'); 