const puppeteer = require("puppeteer");
const path = require("path");
const { runExperiment } = require("./main");
const fs = require("fs");
(async () => {
  // get all the html files in the tests folder
  const tests = fs.readdirSync(path.join(process.cwd(), "tests"));
  const resultsFolder = `results/test-run-${Date.now()}`;
  fs.mkdirSync(resultsFolder, { recursive: true });
  const thresholds = [ 2, 3, 4, 5, 6];
  const results = [
    [
      "test",
      "threshold",
      "true positive",
      "false positive",
      "false negative",
      "true negative",
      "sensitivity",
      "specificity",
      "precision",
      "f1 score",
    ],
  ];
  for (const threshold of thresholds) {
    const thresholdFolder = resultsFolder + `/threshold-${threshold}`;
    fs.mkdirSync(thresholdFolder, { recursive: true });
    for (const test of tests) {
      if (!test.endsWith(".html")) {
        continue;
      }
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      const localPath = path.join("file://", process.cwd(), "tests", test);
      await page.goto(localPath);
      await page.addScriptTag({
        content: `{${runExperiment}}`,
      });
      console.log(
        "########## running experiment: " +
          test +
          " with threshold: " +
          threshold +
          " ##########"
      );
      page.on("console", (msg) => {
        console.log(msg.text());
      });

      const { csv, classificationData, scores } = await page.evaluate(
        (threshold) => {
          return runExperiment(threshold);
        }
      );
      results.push([test, threshold, ...scores]);
      fs.writeFileSync(
        `${thresholdFolder}/${test}-results.csv`,
        csv.map((row) => row.join(",")).join("\n")
      );
      fs.writeFileSync(
        `${thresholdFolder}/${test}-classification.csv`,
        classificationData.map((row) => row.join(",")).join("\n")
      );
      await browser.close();
    }
  }
  fs.writeFileSync(
    `${resultsFolder}/results.csv`,
    results.map((row) => row.join(",")).join("\n")
  );
})();
