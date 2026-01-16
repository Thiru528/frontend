const axios = require('axios');

const ADZUNA_APP_ID = 'cbe7ae22';
const ADZUNA_APP_KEY = '239a7c17c8f9d8518cb58653ed3fa7f4';

const testAdzuna = async () => {
    try {
        const query = 'Software Developer';
        const location = 'India';
        const page = 1;
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=5&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&content-type=application/json`;

        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);

        console.log('Response Status:', response.status);
        console.log('Jobs Found:', response.data.results.length);
        if (response.data.results.length > 0) {
            console.log('Sample Job:', response.data.results[0].title, 'at', response.data.results[0].company.display_name);
        }
    } catch (error) {
        console.error('API Error:', error.response ? error.response.status : error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
};

testAdzuna();
