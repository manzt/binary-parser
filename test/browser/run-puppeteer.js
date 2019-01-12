/* eslint-env node */

const puppeteer = require("puppeteer");
const path = require("path");

let browser;
return puppeteer
  .launch()
  .then(b => {
    browser = b;
    return b.newPage();
  })
  .then(
    page =>
      new Promise(async (resolve, reject) => {
        page.on("console", msg => {
          console.log(msg.text());
        });
        await page.goto(process.argv[2] || `file:${path.join(__dirname, "run-mocha.html")}`);
        return page
          .evaluate(
            () =>
              new Promise((res, rej) => {
                setInterval(() => {
                  if (window.mocha.stats) {
                    if (
                      window.mocha.failures === 0 &&
                      window.mocha.tests === window.mocha.passes
                    ) {
                      res();
                    } else {
                      rej();
                    }
                  }
                }, 500);
              })
          )
          .then(resolve, reject);
      })
  )
  .then(
    () => {
      browser.close();
      process.exit(0);
    },
    () => {
      browser.close();
      process.exit(1);
    }
  );
