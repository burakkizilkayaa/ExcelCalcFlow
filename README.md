# ExcelCalcFlow

A simple calculator project template for reading calculation data from an Excel file and combining it with live USD/EUR exchange rates from an online API.

## What this project does
- Reads an Excel workbook as the data source for calculation inputs.
- Fetches live currency rates for USD and EUR.
- Uses those rates inside the calculator flow to show instant values in the app or exported Excel output.

## Suggested GitHub project name
ExcelCalcFlow

## Project structure
- `src/` — Python application logic
- `data/` — sample Excel input file
- `requirements.txt` — dependencies

## Quick start
1. Install dependencies:
   pip install -r requirements.txt
2. Run the calculator:
   python src/calculator_app.py --excel data/sample_input.xlsx

## Notes
- The Excel file is treated as the database/input source for the calculator.
- The app currently uses live FX rates from an online API to enrich the workbook data.
