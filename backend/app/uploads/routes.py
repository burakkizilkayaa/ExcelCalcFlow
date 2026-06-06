import io
import sys
from pathlib import Path

import pandas as pd
from flask import request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Upload, Result, FXSnapshot
from . import uploads_bp

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "src"))
from calculator_app import fetch_live_rates, load_excel, calculate  # noqa: E402


@uploads_bp.route("/", methods=["POST"])
@jwt_required()
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename or not file.filename.endswith(".xlsx"):
        return jsonify({"error": "Only .xlsx files are accepted"}), 400

    user_id = int(get_jwt_identity())
    upload_folder = Path(current_app.config["UPLOAD_FOLDER"]) / str(user_id)
    upload_folder.mkdir(parents=True, exist_ok=True)

    file_path = upload_folder / file.filename
    file.save(str(file_path))

    upload = Upload(
        user_id=user_id,
        filename=file.filename,
        file_path=str(file_path),
        status="pending",
    )
    db.session.add(upload)
    db.session.flush()

    try:
        rates = fetch_live_rates()
        df = load_excel(file_path)
        result_df = calculate(df, rates)

        for i, row in result_df.iterrows():
            db.session.add(
                Result(
                    upload_id=upload.id,
                    row_index=int(i),
                    description=str(row.get("description", "")),
                    amount=float(row.get("amount", 0)),
                    currency=str(row.get("currency", "")),
                    live_rate=float(row.get("live_rate", 0)),
                    converted_try=float(row.get("converted_try", 0)),
                )
            )

        db.session.add(
            FXSnapshot(
                upload_id=upload.id,
                usd_to_try=rates["USD"],
                eur_to_try=rates["EUR"],
            )
        )

        upload.row_count = len(result_df)
        upload.status = "done"

    except Exception as e:
        upload.status = "error"
        upload.error_msg = str(e)

    db.session.commit()
    return jsonify(_serialize_upload(upload)), 201


@uploads_bp.route("/", methods=["GET"])
@jwt_required()
def list_uploads():
    user_id = int(get_jwt_identity())
    uploads = (
        Upload.query.filter_by(user_id=user_id)
        .order_by(Upload.uploaded_at.desc())
        .all()
    )
    return jsonify([_serialize_upload(u) for u in uploads])


@uploads_bp.route("/<int:upload_id>", methods=["GET"])
@jwt_required()
def get_upload(upload_id):
    user_id = int(get_jwt_identity())
    upload = Upload.query.filter_by(id=upload_id, user_id=user_id).first_or_404()
    data = _serialize_upload(upload)
    data["results"] = [_serialize_result(r) for r in upload.results]
    if upload.fx_snapshot:
        data["fx_snapshot"] = {
            "usd_to_try": upload.fx_snapshot.usd_to_try,
            "eur_to_try": upload.fx_snapshot.eur_to_try,
            "fetched_at": upload.fx_snapshot.fetched_at.isoformat(),
        }
    return jsonify(data)


@uploads_bp.route("/<int:upload_id>/download", methods=["GET"])
@jwt_required()
def download_upload(upload_id):
    user_id = int(get_jwt_identity())
    upload = Upload.query.filter_by(id=upload_id, user_id=user_id).first_or_404()
    if upload.status != "done":
        return jsonify({"error": "Upload not ready for download"}), 400

    df = pd.DataFrame(
        [
            {
                "description": r.description,
                "amount": r.amount,
                "currency": r.currency,
                "live_rate": r.live_rate,
                "converted_try": r.converted_try,
            }
            for r in upload.results
        ]
    )
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    buf.seek(0)

    stem = upload.filename.removesuffix(".xlsx")
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"{stem}_result.xlsx",
    )


@uploads_bp.route("/<int:upload_id>", methods=["DELETE"])
@jwt_required()
def delete_upload(upload_id):
    user_id = int(get_jwt_identity())
    upload = Upload.query.filter_by(id=upload_id, user_id=user_id).first_or_404()
    db.session.delete(upload)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


def _serialize_upload(upload: Upload) -> dict:
    return {
        "id": upload.id,
        "filename": upload.filename,
        "row_count": upload.row_count,
        "status": upload.status,
        "error_msg": upload.error_msg,
        "uploaded_at": upload.uploaded_at.isoformat(),
    }


def _serialize_result(result: Result) -> dict:
    return {
        "id": result.id,
        "row_index": result.row_index,
        "description": result.description,
        "amount": result.amount,
        "currency": result.currency,
        "live_rate": result.live_rate,
        "converted_try": result.converted_try,
    }
