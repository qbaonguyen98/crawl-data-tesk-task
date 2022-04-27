const Crawler = require('./utils/crawler');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const path = require('path');

const url = `https://www.chronext.com/mens-watches`;

async function main() {
  const data = await Crawler.crawl(url);

  const csvWriter = createCsvWriter({
    path: path.resolve(__dirname, `../output/${moment().format('YYYY-MM-DD-HH-mm-ss')}.csv`),
    header: [
      { id: 'name', title: 'NAME' },
      { id: 'referenceNumber', title: 'REFERENCE_NUMBER' },
      { id: 'link', title: 'LINK' },
      { id: 'discountPrice', title: 'DISCOUNT_PRICE' },
      { id: 'price', title: 'PRICE' },
      { id: 'condition', title: 'CONDITION' },
      { id: 'year', title: 'YEAR' }
    ]
  });

  await csvWriter.writeRecords(data);
}

main();
