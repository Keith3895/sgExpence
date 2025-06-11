const fs = require('fs');
const csv = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const axios = require('axios');

// Read and parse the CSV file
const csvFilePath = 'Singapore plan - Expenditure.csv';
const fileContent = fs.readFileSync(csvFilePath, 'utf8');
const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
});

// Function to clean location name
function cleanLocationName(description) {
    // Remove common prefixes and suffixes
    let location = description
        .replace(/SINGAPORE SG/g, 'Singapore')
        .replace(/BATAM/g, 'Batam, Indonesia')
        .replace(/KUALA LUMPUR/g, 'Kuala Lumpur, Malaysia')
        .replace(/LANGK/g, 'Langkawi, Malaysia')
        .replace(/JPO JOHOR/g, 'Johor Premium Outlets, Malaysia')
        .replace(/KULAIJAYA/g, 'Kulai, Malaysia')
        .replace(/KLIA2/g, 'Kuala Lumpur International Airport Terminal 2, Malaysia')
        .replace(/NU SENTRAL/g, 'Nu Sentral, Kuala Lumpur, Malaysia')
        .replace(/CAPSQUARE/g, 'CapSquare, Kuala Lumpur, Malaysia')
        .replace(/QUILL CITY/g, 'Quill City Mall, Kuala Lumpur, Malaysia')
        .replace(/B.BINTANG/g, 'Bukit Bintang, Kuala Lumpur, Malaysia')
        .replace(/DANG WANGI/g, 'Dang Wangi, Kuala Lumpur, Malaysia');

    // Add country if not present
    if (!location.includes('Singapore') && !location.includes('Malaysia') && !location.includes('Indonesia')) {
        location += ', Singapore';
    }

    return location;
}

// Function to get coordinates from Nominatim
async function getCoordinates(location) {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: location,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'sgMap/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            return {
                location: location,
                lat: response.data[0].lat,
                lng: response.data[0].lon
            };
        }
        return {
            location: location,
            lat: '',
            lng: ''
        };
    } catch (error) {
        console.error(`Error geocoding ${location}:`, error.message);
        return {
            location: location,
            lat: '',
            lng: ''
        };
    }
}

// Process records with delay to respect rate limits
async function processRecords() {
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const location = cleanLocationName(record.Description);
        console.log(`Processing ${i + 1}/${records.length}: ${location}`);
        
        const coords = await getCoordinates(location);
        record.location = coords.location;
        record.lat = coords.lat;
        record.lng = coords.lng;

        // Add delay to respect Nominatim's rate limit (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write the updated records back to CSV
    const output = stringify(records, {
        header: true,
        columns: ['Date', 'Description', 'MYR', 'SGD', 'INR', 'location', 'lat', 'lng']
    });

    fs.writeFileSync(csvFilePath, output);
    console.log('CSV file has been updated with location data.');
}

// Run the script
processRecords().catch(console.error); 