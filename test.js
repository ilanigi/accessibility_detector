const puppeteer = require("puppeteer");
const path = require("path");
const { runExperiment } = require("./main");
const fs = require("fs");
(async () => {
  // get all the html files in the tests folder
  const tests = fs.readdirSync(path.join(process.cwd(), "tests"));
  const resultsFolder = `results/test-run-${Date.now()}`;
    fs.mkdirSync(resultsFolder, { recursive: true });
  for (const test of tests) {
    if (!test.endsWith(".html")) {
      continue;
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // navigate to the local file "test1.html"
    const localPath = path.join("file://", process.cwd(), "tests", test);
    await page.goto(localPath);
    await page.addScriptTag({
      content: `{${runExperiment}}`,
    });
    console.log("########## running experiment: " + test + " ##########");
    page.on("console", (msg) => {
      console.log(msg.text());
    });

    const {csv, classificationData} = await page.evaluate(() => runExperiment(5));
    fs.writeFileSync(`${resultsFolder}/${test}-results.csv`, csv.map((row) => row.join(",")).join("\n")); 
    fs.writeFileSync(`${resultsFolder}/${test}-classification.csv`, classificationData.map((row) => row.join(",")).join("\n"));
    await browser.close();
  }
})();

