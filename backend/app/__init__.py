import os
from flask import Flask
from flask_cors import CORS
from .extensions import db, jwt, migrate
from config import config


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from .auth import auth_bp
    from .uploads import uploads_bp
    from .fx import fx_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")
    app.register_blueprint(fx_bp, url_prefix="/api/fx")

    with app.app_context():
        db.create_all()

    return app
