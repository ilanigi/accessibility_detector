const puppeteer = require("puppeteer");
const path = require("path");
const { runExperiment } = require("./main");
const fs = require("fs");
(async () => {
  // get all the html files in the tests folder
  const tests = fs.readdirSync(path.join(process.cwd(), "tests"));
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
    const csv = await page.evaluate(runExperiment);
    fs.writeFileSync(`results/${test}-${Date.now()}.csv`, csv.map((row) => row.join(",")).join("\n")); 
    await browser.close();
  }
})();

