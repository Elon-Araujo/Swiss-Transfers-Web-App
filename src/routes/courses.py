from flask import Blueprint, request, jsonify
from src.models.course import db, Course, Chauffeur
import urllib.parse

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/courses', methods=['GET'])
def get_courses():
    """Récupère toutes les courses"""
    try:
        courses = Course.query.order_by(Course.date_creation.desc()).all()
        return jsonify([course.to_dict() for course in courses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/courses', methods=['POST'])
def create_course():
    """Crée une nouvelle course"""
    try:
        data = request.get_json()
        
        # Validation des données requises
        required_fields = ['lieu_prise_charge', 'destination', 'heure', 'nom_client', 'prix', 'type_vehicule']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Génération du lien WhatsApp
        lien_whatsapp = generer_lien_whatsapp(data)
        
        # Création de la course
        course = Course(
            lieu_prise_charge=data['lieu_prise_charge'],
            destination=data['destination'],
            heure=data['heure'],
            nom_client=data['nom_client'],
            prix=float(data['prix']),
            type_vehicule=data['type_vehicule'],
            anglais_requis=data.get('anglais_requis', False),
            lien_whatsapp=lien_whatsapp
        )
        
        db.session.add(course)
        db.session.commit()
        
        return jsonify(course.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    """Met à jour une course"""
    try:
        course = Course.query.get_or_404(course_id)
        data = request.get_json()
        
        # Mise à jour des champs
        for field in ['statut', 'chauffeur_id']:
            if field in data:
                setattr(course, field, data[field])
        
        db.session.commit()
        return jsonify(course.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Supprime une course"""
    try:
        course = Course.query.get_or_404(course_id)
        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'Course supprimée avec succès'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/chauffeurs', methods=['GET'])
def get_chauffeurs():
    """Récupère tous les chauffeurs"""
    try:
        chauffeurs = Chauffeur.query.filter_by(actif=True).all()
        return jsonify([chauffeur.to_dict() for chauffeur in chauffeurs])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@courses_bp.route('/chauffeurs', methods=['POST'])
def create_chauffeur():
    """Crée un nouveau chauffeur"""
    try:
        data = request.get_json()
        
        # Validation des données requises
        required_fields = ['nom', 'telephone']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        chauffeur = Chauffeur(
            nom=data['nom'],
            telephone=data['telephone'],
            vehicule=data.get('vehicule', ''),
            parle_anglais=data.get('parle_anglais', False)
        )
        
        db.session.add(chauffeur)
        db.session.commit()
        
        return jsonify(chauffeur.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def generer_lien_whatsapp(data):
    """Génère un lien WhatsApp pour la course"""
    message = f"""🚗 COURSE DISPONIBLE 🚗

📍 Prise en charge: {data['lieu_prise_charge']}
🎯 Destination: {data['destination']}
🕐 Heure: {data['heure']}
👤 Client: {data['nom_client']}
💰 Prix: {data['prix']}€
🚗 Véhicule requis: {data['type_vehicule'].upper()}"""

    if data.get('anglais_requis'):
        message += "\n🇬🇧 Anglais requis"

    message += """

✅ Pour ACCEPTER cette course: Répondez OUI
⚠️ Premier arrivé, premier servi !
Cette course sera attribuée dès que vous répondez."""

    # Encoder le message pour l'URL
    message_encode = urllib.parse.quote(message)
    
    # Créer le lien WhatsApp (sans numéro spécifique pour l'instant)
    lien = f"https://wa.me/?text={message_encode}"
    
    return lien

