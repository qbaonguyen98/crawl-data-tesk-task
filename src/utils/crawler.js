const puppeteer = require('puppeteer');
const puppeteerArgs = require('../constants/puppeteer');

class Crawler {
  static interval;
  static counter = 0;

  static async crawl(url) {
    console.log('Start crawling ...');
    Crawler.interval = setInterval(() => {
      Crawler.counter++;
      console.log(Crawler.counter * 3 + 's...');
    }, 3000);

    const browser = await puppeteer.launch({
      headless: true,
      args: puppeteerArgs,
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      req.continue();
    });

    await page.goto(url);

    const products = await page.evaluate(async () => {
      const products = [];

      async function scrollToTheEnd() {
        return new Promise((resolve) => {
          let totalHeight = 0;
          let distance = 100;
          let timer = setInterval(() => {
            let scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
  
            if(totalHeight >= scrollHeight - window.innerHeight){
              clearInterval(timer);
              resolve();
            }
          }, 2);
        });
      }

      async function waitForDataLoaded() {
        return new Promise((resolve) => setTimeout(() => resolve(), 3000));
      }

      async function traverse() {
        await scrollToTheEnd();

        const productTileElements = document.querySelectorAll('.product-list > .product-tile > .product-tile__wrapper');

        productTileElements.forEach(ele => {
          const name = ele.querySelector('.product-tile__model').innerHTML;
          const referenceNumber = ele.querySelector('.product-tile__reference').innerHTML;
          const link = `https://www.chronext.com` + ele.querySelector('a').getAttribute('href');
          const discountPriceElement = ele.querySelector('.product-tile__price .price--discounted');
          const discountPrice = discountPriceElement ? discountPriceElement.innerHTML : ele.querySelector('.product-tile__price .price').innerHTML;
          const price = discountPriceElement ? ele.querySelector('.product-tile__price .price--strike').innerHTML : ele.querySelector('.product-tile__price .price').innerHTML;
          const condition = ele.querySelector('.product-tile__condition .condition-with-icon__text').innerHTML;

          products.push({
            name,
            referenceNumber,
            link,
            discountPrice,
            price,
            condition
          });
        });

        const nextPageLinkElement = document.querySelector('.pagination .pagination__list .pagination__item.pagination__item--next a');

        if (nextPageLinkElement) {
          nextPageLinkElement.click();

          await waitForDataLoaded();

          await traverse();
        } else {
          return;
        }
      }

      await traverse();

      return products;
    });

    // Get the year
    for (let p of products) {
      let arr = p.discountPrice.split('&nbsp;');
      p.discountPrice = arr[arr.length - 1];

      arr = p.price.split('&nbsp;');
      p.price = arr[arr.length - 1];

      await page.goto(p.link);

      const year = await page.evaluate(() => {
        const year = document.querySelector('.product-specifications-accordion .accordion-item__wrapper--open .specification__wrapper:nth-child(2) .specification__value').innerHTML;
        return year;
      });

      p.year = year;
    }

    await browser.close();

    console.log(`Crawling completed after ${Math.round((Crawler.counter * 2) / 60) + 1} minutes. Got ${products.length} products.`);
    clearInterval(Crawler.interval);
    Crawler.counter = 0;

    return products;
  }
}

module.exports = Crawler;
