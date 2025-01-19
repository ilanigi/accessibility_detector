# accessibility_detector

# Accessibility Issue Detector
This tool automatically detects potential accessibility issues in web pages by identifying interactive elements that are not properly keyboard accessible.

## Features
- Analyzes HTML pages for accessibility issues
- Detects elements that look interactive but lack keyboard accessibility
- Generates detailed CSV reports with classification data and metrics
- Includes test suite with various test cases

## Getting Started

### Prerequisites
- Node.js version 20 or compatible
- NPM package manager

### Installation

```
npm i
```

### Running the Experiment

```
node testRunner.js
```


![ezgif-3-cc56fff050](https://github.com/user-attachments/assets/347964f0-a0e2-4527-a66f-773309131f07)


## Results
The experiment generates detailed results organized as follows:

1. For each threshold value ( currently 2-6), a separate folder is created containing:
   - Individual CSV files for each test case with detailed classification data
   - Element-by-element analysis showing which were flagged as accessibility issues

2. A consolidated results.csv file containing key metrics for each test/threshold combination:
   - True/False Positives and Negatives
   - Sensitivity (True Positive Rate)
   - Specificity (True Negative Rate) 
   - Precision
   - F1 Score

This allows for analyzing how different threshold values affect detection accuracy and comparing performance across test cases.