from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    lieu_prise_charge = db.Column(db.String(200), nullable=False)
    destination = db.Column(db.String(200), nullable=False)
    heure = db.Column(db.String(50), nullable=False)
    nom_client = db.Column(db.String(100), nullable=False)
    prix = db.Column(db.Float, nullable=False)
    type_vehicule = db.Column(db.String(50), nullable=False)
    anglais_requis = db.Column(db.Boolean, default=False)
    statut = db.Column(db.String(50), default='En attente')
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    lien_whatsapp = db.Column(db.Text)
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'lieu_prise_charge': self.lieu_prise_charge,
            'destination': self.destination,
            'heure': self.heure,
            'nom_client': self.nom_client,
            'prix': self.prix,
            'type_vehicule': self.type_vehicule,
            'anglais_requis': self.anglais_requis,
            'statut': self.statut,
            'date_creation': self.date_creation.isoformat() if self.date_creation else None,
            'lien_whatsapp': self.lien_whatsapp,
            'chauffeur_id': self.chauffeur_id
        }

class Chauffeur(db.Model):
    __tablename__ = 'chauffeurs'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    vehicule = db.Column(db.String(100))
    parle_anglais = db.Column(db.Boolean, default=False)
    actif = db.Column(db.Boolean, default=True)
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec les courses
    courses = db.relationship('Course', backref='chauffeur', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nom': self.nom,
            'telephone': self.telephone,
            'vehicule': self.vehicule,
            'parle_anglais': self.parle_anglais,
            'actif': self.actif,
            'date_creation': self.date_creation.isoformat() if self.date_creation else None
        }

