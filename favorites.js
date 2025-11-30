// System ulubionych przepisów (localStorage)

// Pobierz ulubione z localStorage
function getFavorites() {
    const stored = localStorage.getItem('resztki_ulubione');
    return stored ? JSON.parse(stored) : [];
}

// Zapisz ulubione do localStorage
function saveFavorites(favorites) {
    localStorage.setItem('resztki_ulubione', JSON.stringify(favorites));
}

// Dodaj do ulubionych
function addToFavorites(recipe) {
    const favorites = getFavorites();
    
    // Sprawdź czy już jest
    const exists = favorites.find(f => f.id === recipe.id);
    if (exists) {
        alert('⭐ Ten przepis już jest w ulubionych!');
        return;
    }
    
    // Dodaj timestamp
    recipe.addedAt = new Date().toISOString();
    
    favorites.push(recipe);
    saveFavorites(favorites);
    
    alert('✅ Dodano do ulubionych!');
    
    // Odśwież licznik jeśli jest widoczny
    updateFavoritesCount();
}

// Usuń z ulubionych
function removeFromFavorites(recipeId) {
    let favorites = getFavorites();
    favorites = favorites.filter(f => f.id !== recipeId);
    saveFavorites(favorites);
    
    // Odśwież widok ulubionych
    showFavorites();
    updateFavoritesCount();
}

// Pokaż ulubione
function showFavorites() {
    const favorites = getFavorites();
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '';
    resultsSection.style.display = 'block';
    
    if (favorites.length === 0) {
        resultsDiv.innerHTML = `
            <div class="alert alert-warning">
                <h3>⭐ Brak ulubionych przepisów</h3>
                <p>Dodaj przepisy do ulubionych klikając przycisk "⭐ Dodaj do ulubionych" w szczegółach przepisu.</p>
                <p style="margin-top: 10px;">Możesz dodawać:</p>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Przepisy z lokalnej bazy</li>
                    <li>Przepisy z API Spoonacular</li>
                    <li>Przepisy wygenerowane przez AI 🤖</li>
                </ul>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = `
        <div class="alert alert-success">
            ⭐ Masz ${favorites.length} ulubionych przepisów!
        </div>
    `;
    
    // Sortuj od najnowszych
    favorites.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    
    favorites.forEach(recipe => {
        const card = createFavoriteCard(recipe);
        resultsDiv.appendChild(card);
    });
    
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Utwórz kartę ulubionego przepisu
function createFavoriteCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.style.borderLeft = '5px solid #f59e0b';
    
    // Badge
    const badge = document.createElement('div');
    badge.style.cssText = 'background: #fef3c7; color: #92400e; padding: 5px 10px; border-radius: 5px; display: inline-block; margin-bottom: 10px; font-size: 0.9em;';
    if (recipe.fromAI) {
        badge.textContent = '🤖 Wygenerowane przez AI';
    } else {
        badge.textContent = '⭐ Ulubione';
    }
    card.appendChild(badge);
    
    // Tytuł
    const title = document.createElement('div');
    title.className = 'recipe-title';
    title.textContent = `🍽️ ${recipe.nazwa}`;
    card.appendChild(title);
    
    // Info
    const info = document.createElement('div');
    info.className = 'recipe-info';
    let infoText = `⏱️ ${recipe.czas || 'nieznany'}`;
    if (recipe.porcje) infoText += ` | 🍽️ ${recipe.porcje} porcje`;
    if (recipe.dieta) infoText += ` | 🥗 ${recipe.dieta}`;
    info.textContent = infoText;
    card.appendChild(info);
    
    // Data dodania
    const dateAdded = document.createElement('div');
    dateAdded.style.cssText = 'font-size: 0.85em; color: #718096; margin: 5px 0;';
    const date = new Date(recipe.addedAt);
    dateAdded.textContent = `Dodano: ${date.toLocaleDateString('pl-PL')} ${date.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'})}`;
    card.appendChild(dateAdded);
    
    // Przyciski
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
    
    const viewButton = document.createElement('button');
    viewButton.className = 'recipe-button';
    viewButton.textContent = '📖 Zobacz przepis';
    viewButton.style.flex = '1';
    viewButton.onclick = () => {
        if (recipe.fromAI) {
            displayAIRecipe(recipe);
        } else {
            showRecipeDetails(recipe);
        }
    };
    buttonsDiv.appendChild(viewButton);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'recipe-button';
    removeButton.textContent = '🗑️ Usuń';
    removeButton.style.cssText = 'flex: 1; background: #e53e3e;';
    removeButton.onclick = () => {
        if (confirm(`Czy na pewno chcesz usunąć "${recipe.nazwa}" z ulubionych?`)) {
            removeFromFavorites(recipe.id);
        }
    };
    buttonsDiv.appendChild(removeButton);
    
    card.appendChild(buttonsDiv);
    
    return card;
}

// Aktualizuj licznik ulubionych
function updateFavoritesCount() {
    const favorites = getFavorites();
    const countElement = document.getElementById('favoritesCount');
    if (countElement) {
        countElement.textContent = favorites.length;
        countElement.style.display = favorites.length > 0 ? 'inline' : 'none';
    }
}

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesCount();
});
