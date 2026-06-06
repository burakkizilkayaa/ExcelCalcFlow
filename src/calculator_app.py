import argparse
import json
from pathlib import Path

import pandas as pd
import requests


API_URL = "https://api.frankfurter.app/latest?from=USD&to=EUR,TRY"


def fetch_live_rates() -> dict:
    response = requests.get(API_URL, timeout=30)
    response.raise_for_status()
    data = response.json()
    usd_to_eur = data.get("rates", {}).get("EUR", 1.0)
    usd_to_try = data.get("rates", {}).get("TRY", 1.0)

    return {
        "USD": usd_to_try,
        "EUR": usd_to_try / usd_to_eur,
        "TRY": 1.0,
    }


def load_excel(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path)
    required = {"amount", "currency", "description"}
    missing = required.difference(set(df.columns))
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    return df


def calculate(df: pd.DataFrame, rates: dict) -> pd.DataFrame:
    result = df.copy()
    result["live_rate"] = result["currency"].map({"USD": rates["USD"], "EUR": rates["EUR"], "TRY": rates["TRY"]})
    result["converted_try"] = result["amount"] * result["live_rate"]
    result["source"] = "excel-driven"
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Read Excel data and apply live FX rates")
    parser.add_argument("--excel", required=True, help="Path to the Excel file to read")
    parser.add_argument("--output", help="Optional output Excel file path")
    args = parser.parse_args()

    excel_path = Path(args.excel)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")

    rates = fetch_live_rates()
    df = load_excel(excel_path)
    result = calculate(df, rates)

    output_path = Path(args.output) if args.output else excel_path.with_name(f"{excel_path.stem}_result.xlsx")
    result.to_excel(output_path, index=False)

    print("Live FX rates used:")
    print(json.dumps(rates, indent=2))
    print("\nCalculated result:")
    print(result.to_string(index=False))
    print(f"\nSaved output to: {output_path}")


if __name__ == "__main__":
    main()
