// Configuration de l'API
const API_BASE = '/api';

// État de l'application
let currentSection = 'courses';
let courses = [];
let drivers = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    showSection('courses');
    loadCourses();
    loadDrivers();
    setupEventListeners();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Formulaire de création de course
    document.getElementById('course-form').addEventListener('submit', handleCreateCourse);
    
    // Formulaire d'ajout de chauffeur
    document.getElementById('driver-form').addEventListener('submit', handleCreateDriver);
    
    // Filtre de statut
    document.getElementById('status-filter').addEventListener('change', filterCourses);
}

// Navigation entre sections
function showSection(section) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Afficher la section demandée
    document.getElementById(section + '-section').classList.remove('hidden');
    
    // Mettre à jour les boutons de navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-600');
        btn.classList.add('text-gray-600');
    });
    
    // Activer le bouton correspondant
    event.target.closest('.nav-btn').classList.remove('text-gray-600');
    event.target.closest('.nav-btn').classList.add('text-blue-600');
    
    currentSection = section;
    
    // Recharger les données si nécessaire
    if (section === 'courses') {
        loadCourses();
    } else if (section === 'drivers') {
        loadDrivers();
    }
}

// Chargement des courses
async function loadCourses() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/courses`);
        if (!response.ok) throw new Error('Erreur lors du chargement des courses');
        
        courses = await response.json();
        displayCourses(courses);
    } catch (error) {
        showToast('Erreur lors du chargement des courses', 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Affichage des courses
function displayCourses(coursesToShow) {
    const container = document.getElementById('courses-list');
    
    if (coursesToShow.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>Aucune course trouvée</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = coursesToShow.map(course => `
        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="font-medium text-gray-900">
                        <i class="fas fa-map-marker-alt text-blue-500 mr-1"></i>
                        ${course.lieu_prise_charge} → ${course.destination}
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                        <i class="fas fa-user mr-1"></i>
                        ${course.nom_client} • 
                        <i class="fas fa-clock mr-1"></i>
                        ${course.heure} • 
                        <i class="fas fa-euro-sign mr-1"></i>
                        ${course.prix}€
                    </p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(course.statut)}">
                    ${course.statut}
                </span>
            </div>
            
            <div class="flex flex-wrap gap-2 mb-3">
                <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    <i class="fas fa-car mr-1"></i>
                    ${course.type_vehicule}
                </span>
                ${course.anglais_requis ? '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"><i class="fas fa-language mr-1"></i>Anglais</span>' : ''}
            </div>
            
            <div class="flex flex-wrap gap-2">
                <select onchange="updateCourseStatus(${course.id}, this.value)" 
                        class="text-sm border border-gray-300 rounded px-2 py-1">
                    <option value="En attente" ${course.statut === 'En attente' ? 'selected' : ''}>En attente</option>
                    <option value="Acceptée" ${course.statut === 'Acceptée' ? 'selected' : ''}>Acceptée</option>
                    <option value="En cours" ${course.statut === 'En cours' ? 'selected' : ''}>En cours</option>
                    <option value="Terminée" ${course.statut === 'Terminée' ? 'selected' : ''}>Terminée</option>
                </select>
                
                ${course.lien_whatsapp ? `
                    <button onclick="openWhatsApp('${course.lien_whatsapp}')" 
                            class="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                        <i class="fab fa-whatsapp mr-1"></i>
                        WhatsApp
                    </button>
                ` : ''}
                
                <button onclick="deleteCourse(${course.id})" 
                        class="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    <i class="fas fa-trash mr-1"></i>
                    Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

// Couleurs des statuts
function getStatusColor(status) {
    const colors = {
        'En attente': 'bg-yellow-100 text-yellow-800',
        'Acceptée': 'bg-blue-100 text-blue-800',
        'En cours': 'bg-orange-100 text-orange-800',
        'Terminée': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// Filtrage des courses
function filterCourses() {
    const statusFilter = document.getElementById('status-filter').value;
    let filteredCourses = courses;
    
    if (statusFilter) {
        filteredCourses = courses.filter(course => course.statut === statusFilter);
    }
    
    displayCourses(filteredCourses);
}

// Création d'une nouvelle course
async function handleCreateCourse(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const courseData = {
        lieu_prise_charge: document.getElementById('lieu_prise_charge').value,
        destination: document.getElementById('destination').value,
        heure: document.getElementById('heure').value,
        nom_client: document.getElementById('nom_client').value,
        prix: parseFloat(document.getElementById('prix').value),
        type_vehicule: document.getElementById('type_vehicule').value,
        anglais_requis: document.getElementById('anglais_requis').checked
    };
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(courseData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création de la course');
        }
        
        const newCourse = await response.json();
        showToast('Course créée avec succès !');
        
        // Réinitialiser le formulaire
        event.target.reset();
        
        // Retourner à la liste des courses
        showSection('courses');
        loadCourses();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    } finally {
        showLoading(false);
    }
}

// Mise à jour du statut d'une course
async function updateCourseStatus(courseId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ statut: newStatus })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        
        showToast('Statut mis à jour');
        loadCourses();
        
    } catch (error) {
        showToast('Erreur lors de la mise à jour', 'error');
        console.error(error);
    }
}

// Suppression d'une course
async function deleteCourse(courseId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette course ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        showToast('Course supprimée');
        loadCourses();
        
    } catch (error) {
        showToast('Erreur lors de la suppression', 'error');
        console.error(error);
    }
}

// Ouverture de WhatsApp
function openWhatsApp(link) {
    window.open(link, '_blank');
}

// Chargement des chauffeurs
async function loadDrivers() {
    try {
        const response = await fetch(`${API_BASE}/chauffeurs`);
        if (!response.ok) throw new Error('Erreur lors du chargement des chauffeurs');
        
        drivers = await response.json();
        displayDrivers(drivers);
    } catch (error) {
        showToast('Erreur lors du chargement des chauffeurs', 'error');
        console.error(error);
    }
}

// Affichage des chauffeurs
function displayDrivers(driversToShow) {
    const container = document.getElementById('drivers-list');
    
    if (driversToShow.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-users text-4xl mb-4"></i>
                <p>Aucun chauffeur trouvé</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = driversToShow.map(driver => `
        <div class="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
            <div>
                <h3 class="font-medium text-gray-900">
                    <i class="fas fa-user mr-2"></i>
                    ${driver.nom}
                </h3>
                <p class="text-sm text-gray-600">
                    <i class="fas fa-phone mr-1"></i>
                    ${driver.telephone}
                    ${driver.vehicule ? ` • <i class="fas fa-car mr-1"></i>${driver.vehicule}` : ''}
                    ${driver.parle_anglais ? ' • <i class="fas fa-language mr-1"></i>Anglais' : ''}
                </p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full ${driver.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${driver.actif ? 'Actif' : 'Inactif'}
            </span>
        </div>
    `).join('');
}

// Création d'un nouveau chauffeur
async function handleCreateDriver(event) {
    event.preventDefault();
    
    const driverData = {
        nom: document.getElementById('driver_nom').value,
        telephone: document.getElementById('driver_telephone').value,
        vehicule: document.getElementById('driver_vehicule').value,
        parle_anglais: document.getElementById('driver_anglais').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/chauffeurs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(driverData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la création du chauffeur');
        }
        
        showToast('Chauffeur ajouté avec succès !');
        event.target.reset();
        loadDrivers();
        
    } catch (error) {
        showToast(error.message, 'error');
        console.error(error);
    }
}

// Affichage des notifications toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    
    // Changer la couleur selon le type
    const toastDiv = toast.querySelector('div');
    if (type === 'error') {
        toastDiv.className = 'bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    } else {
        toastDiv.className = 'bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    }
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Affichage du spinner de chargement
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

