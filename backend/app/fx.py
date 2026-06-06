import sys
from pathlib import Path
from flask import Blueprint, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))
from calculator_app import fetch_live_rates  # noqa: E402

fx_bp = Blueprint("fx", __name__)


@fx_bp.route("/latest", methods=["GET"])
def latest_rates():
    try:
        rates = fetch_live_rates()
        return jsonify({"usd_to_try": rates["USD"], "eur_to_try": rates["EUR"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 502
