from datetime import datetime
from .extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploads = db.relationship("Upload", back_populates="user", cascade="all, delete-orphan")


class Upload(db.Model):
    __tablename__ = "uploads"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    row_count = db.Column(db.Integer)
    status = db.Column(db.String(50), default="pending")
    error_msg = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="uploads")
    results = db.relationship("Result", back_populates="upload", cascade="all, delete-orphan")
    fx_snapshot = db.relationship(
        "FXSnapshot", back_populates="upload", uselist=False, cascade="all, delete-orphan"
    )


class Result(db.Model):
    __tablename__ = "results"

    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey("uploads.id"), nullable=False)
    row_index = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Float)
    currency = db.Column(db.String(10))
    live_rate = db.Column(db.Float)
    converted_try = db.Column(db.Float)

    upload = db.relationship("Upload", back_populates="results")


class FXSnapshot(db.Model):
    __tablename__ = "fx_snapshots"

    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey("uploads.id"), nullable=False)
    usd_to_try = db.Column(db.Float)
    eur_to_try = db.Column(db.Float)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)

    upload = db.relationship("Upload", back_populates="fx_snapshot")
