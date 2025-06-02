document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'http://localhost:3001/api'; 

    let appState = {
        currentUser: null,
        authToken: null,
        cars: [],
        favoriteCarIds: [],
        purchasedCars: [] 
    };

    const sections = document.querySelectorAll('main section, .container > section');
    const carsContainer = document.getElementById('cars-container');
    const favoritesContainer = document.getElementById('favorites-container');
    const purchasesContainer = document.getElementById('purchases-container');
    const userListBody = document.getElementById('user-list-body');
    const loggedOutView = document.getElementById('logged-out-view');
    const loggedInView = document.getElementById('logged-in-view');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileUserAuthLinks = document.getElementById('mobile-user-auth-links');
    const adminMenuLinkContainer = document.getElementById('admin-menu-link-container');
    const mobileAdminMenuLink = document.getElementById('mobile-admin-menu-link-container');
    const authForm = document.getElementById('auth-form');
    const addCarForm = document.getElementById('add-car-form');
    const editCarForm = document.getElementById('edit-car-form');
    const authTitle = document.getElementById('auth-title');

    const api = {
        request: async (endpoint, method = 'GET', body = null, token = null) => {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            const config = { method, headers };
            if (body && (method === 'POST' || method === 'PUT')) {
                 config.body = JSON.stringify(body);
            }

            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
                const responseData = await response.json();
                
                if (!response.ok) {
                    console.error('API Error Response:', responseData);
                    throw new Error(responseData.message || `HTTP Error: ${response.status}`);
                }
                return responseData;
            } catch (error) {
                console.error('Fetch API Error:', error);
                // Network error veya JSON parse error gibi durumlar için
                if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
                     throw new Error("Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edin veya sunucunun çalıştığından emin olun.");
                }
                throw error; // Re-throw the original or modified error
            }
        },
        get: (endpoint, token = null) => api.request(endpoint, 'GET', null, token),
        post: (endpoint, body, token = null) => api.request(endpoint, 'POST', body, token),
        put: (endpoint, body, token) => api.request(endpoint, 'PUT', body, token),
        delete: (endpoint, token) => api.request(endpoint, 'DELETE', null, token),
    };

    window.showSection = (sectionId) => {
        sections.forEach(section => section.classList.add('hidden'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            if (sectionId === 'car-list' && (appState.cars.length === 0 || !carsContainer.hasChildNodes())) fetchAndDisplayCars();
            if (sectionId === 'user-profile') displayUserProfile();
            if (sectionId === 'favorites') displayFavorites();
            if (sectionId === 'purchases') displayPurchases();
        }
        if(!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            mobileMenuIcon.classList.remove('fa-times');
            mobileMenuIcon.classList.add('fa-bars');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
        window.scrollTo(0, 0);
    };

    window.showMessage = (message, type = 'info') => {
        const messageModal = document.getElementById('messageModal');
        const modalMessageEl = document.getElementById('modal-message');
        const modalIconEl = document.getElementById('message-modal-icon');
        
        modalMessageEl.textContent = message;
        
        let iconHtml = '';
        let iconColorClass = 'text-blue-500';
        if (type === 'success') {
            iconHtml = '<i class="fas fa-check-circle text-5xl"></i>';
            iconColorClass = 'text-green-500';
        } else if (type === 'error') {
            iconHtml = '<i class="fas fa-times-circle text-5xl"></i>';
            iconColorClass = 'text-red-500';
        } else { 
            iconHtml = '<i class="fas fa-info-circle text-5xl"></i>';
        }
        modalIconEl.innerHTML = iconHtml;
        modalIconEl.className = `mx-auto mb-5 ${iconColorClass}`; // Renk sınıfını dinamik olarak ayarla
        
        messageModal.classList.add('is-open');
    };

    window.showConfirmation = (message, onConfirm) => {
        document.getElementById('confirmation-message').textContent = message;
        const confirmModal = document.getElementById('confirmationModal');
        confirmModal.classList.add('is-open');

        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');
        
        // Önceki event listener'ları temizle (çoklu tıklama sorununu önlemek için)
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        const newNoBtn = noBtn.cloneNode(true);
        noBtn.parentNode.replaceChild(newNoBtn, noBtn);

        const confirmHandler = () => {
            onConfirm();
            closeModal('confirmationModal');
        };
        const cancelHandler = () => {
            closeModal('confirmationModal');
        };
        
        newYesBtn.addEventListener('click', confirmHandler, { once: true });
        newNoBtn.addEventListener('click', cancelHandler, { once: true });
    };
    
    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('is-open');
        }
    };

    const updateAuthUI = () => {
        const mobileAuthContainer = document.getElementById('mobile-user-auth-links');
        mobileAuthContainer.innerHTML = ''; 

        if (appState.currentUser && appState.authToken) {
            loggedOutView.classList.add('hidden');
            loggedInView.classList.remove('hidden');
            document.getElementById('user-menu-username').textContent = appState.currentUser.username;
            const avatar = document.getElementById('user-avatar');
            avatar.textContent = appState.currentUser.username.charAt(0).toUpperCase();

            if (appState.currentUser.isAdmin) {
                adminMenuLinkContainer.classList.remove('hidden');
                mobileAdminMenuLink.classList.remove('hidden');
            } else {
                adminMenuLinkContainer.classList.add('hidden');
                mobileAdminMenuLink.classList.add('hidden');
            }
            mobileAuthContainer.innerHTML = `
                <a href="#" onclick="showSection('user-profile'); return false;" class="text-gray-700 hover:bg-blue-50 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">Profilim</a>
                <a href="#" onclick="logout(); return false;" class="text-red-600 hover:bg-red-50 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200">Çıkış Yap</a>
            `;
        } else {
            loggedOutView.classList.remove('hidden');
            loggedInView.classList.add('hidden');
            adminMenuLinkContainer.classList.add('hidden');
            mobileAdminMenuLink.classList.add('hidden');
            mobileAuthContainer.innerHTML = `
                 <a href="#" onclick="showSection('user-auth'); return false;" class="bg-blue-600 text-white block w-full text-center px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors duration-200">Giriş Yap / Kayıt Ol</a>
            `;
        }
    };

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isRegisterMode = !document.getElementById('register-fields').classList.contains('hidden');
        const submitBtn = document.getElementById('auth-submit-btn');
        const originalBtnHtml = submitBtn.innerHTML; // Butonun orijinal içeriğini sakla
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="loader !w-5 !h-5 !border-2 !border-t-blue-500 mx-auto"></div>`;
        const authErrorMsg = document.getElementById('auth-error-message');
        authErrorMsg.classList.add('hidden');

        try {
            let payload;
            if (isRegisterMode) {
                payload = {
                    username: document.getElementById('register-username').value,
                    email: document.getElementById('register-email').value,
                    password: document.getElementById('password').value,
                };
                await api.post('/auth/register', payload);
                showMessage('Kayıt başarılı! Lütfen şimdi giriş yapın.', 'success');
                toggleAuthModeUI(false); 
            } else {
                payload = {
                    emailOrUsername: document.getElementById('emailOrUsername').value,
                    password: document.getElementById('password').value,
                };
                const data = await api.post('/auth/login', payload);
                login(data.accessToken, data.user);
            }
        } catch (error) {
            authErrorMsg.textContent = error.message;
            authErrorMsg.classList.remove('hidden');
        } finally {
             submitBtn.disabled = false;
             // Butonun orijinal metnini geri yükle (Kayıt Ol veya Giriş Yap)
             submitBtn.innerHTML = isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap';
        }
    });
    
    const login = (token, user) => {
        appState.authToken = token;
        appState.currentUser = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateAuthUI();
        fetchUserData(); 
        showMessage(`Hoş geldiniz, ${user.username}!`, 'success');
        showSection('car-list');
    };

    window.logout = () => {
        showConfirmation("Çıkış yapmak istediğinizden emin misiniz?", () => {
            appState.currentUser = null;
            appState.authToken = null;
            appState.cars = [];
            appState.favoriteCarIds = [];
            appState.purchasedCars = [];
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            updateAuthUI();
            showMessage('Başarıyla çıkış yaptınız.', 'info');
            showSection('home');
        });
    };

    const checkInitialAuth = () => {
        const token = localStorage.getItem('authToken');
        const userString = localStorage.getItem('currentUser');
        if (token && userString) {
            try {
                const user = JSON.parse(userString);
                appState.authToken = token;
                appState.currentUser = user;
                updateAuthUI();
                fetchUserData();
            } catch (e) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                updateAuthUI();
            }
        } else {
            updateAuthUI();
        }
    };
    
    const fetchUserData = async () => {
         if (!appState.currentUser || !appState.authToken) return;
         try {
            const [favorites, purchases] = await Promise.all([
                api.get('/user/favorites', appState.authToken),
                api.get('/user/purchases', appState.authToken)
            ]);
            appState.favoriteCarIds = favorites;
            appState.purchasedCars = purchases;
         } catch (error) {
            console.error("Kullanıcı verileri çekilirken hata:", error);
            if (error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('yetki')) {
                logout(); // Token hatası veya yetki hatası varsa çıkış yap
                showMessage('Oturumunuz sonlanmış veya geçersiz. Lütfen tekrar giriş yapın.', 'error');
            }
         }
    }

    const toggleAuthModeUI = (isRegister) => {
        const registerFields = document.getElementById('register-fields');
        const toggleLink = document.getElementById('toggle-auth-mode');
        const submitBtn = document.getElementById('auth-submit-btn');
        const emailOrUsernameInput = document.getElementById('emailOrUsername');
        const authErrorMsg = document.getElementById('auth-error-message');

        authErrorMsg.classList.add('hidden'); 
        authForm.reset();

        if (isRegister) {
            registerFields.classList.remove('hidden');
            authTitle.textContent = 'Yeni Hesap Oluştur';
            submitBtn.textContent = 'Kayıt Ol';
            toggleLink.textContent = 'Zaten hesabınız var mı? Giriş Yapın.';
            emailOrUsernameInput.required = false;
            document.getElementById('register-username').required = true;
            document.getElementById('register-email').required = true;
        } else {
            registerFields.classList.add('hidden');
            authTitle.textContent = 'Hesabınıza Giriş Yapın';
            submitBtn.textContent = 'Giriş Yap';
            toggleLink.textContent = 'Hesabınız yok mu? Kayıt Olun.';
            emailOrUsernameInput.required = true;
            document.getElementById('register-username').required = false;
            document.getElementById('register-email').required = false;
        }
    };
    
    document.getElementById('toggle-auth-mode').addEventListener('click', (e) => {
        e.preventDefault();
        const isRegisterMode = document.getElementById('register-fields').classList.contains('hidden');
        toggleAuthModeUI(isRegisterMode);
    });

    const renderCars = (container, carList, sectionType = 'car-list') => {
        container.innerHTML = '';
        const noFavsMsg = document.getElementById('no-favorites-message');
        const noPurchasesMsg = document.getElementById('no-purchases-message');

        if (noFavsMsg) noFavsMsg.classList.add('hidden');
        if (noPurchasesMsg) noPurchasesMsg.classList.add('hidden');

        if (!carList || carList.length === 0) {
             let emptyMessage = "Gösterilecek araba bulunamadı.";
             if (sectionType === 'favorites') {
                emptyMessage = "Favori listenizde henüz araba yok.";
                if(noFavsMsg) noFavsMsg.classList.remove('hidden');
             } else if (sectionType === 'purchases') {
                emptyMessage = "Henüz satın aldığınız bir araba yok.";
                if(noPurchasesMsg) noPurchasesMsg.classList.remove('hidden');
             }
             container.innerHTML = `<p class="col-span-full text-center text-gray-500 py-12 text-lg">${emptyMessage}</p>`;
             return;
        }

        carList.forEach(car => {
            if (!car || typeof car.id === 'undefined') { // Araba objesinin ve ID'sinin varlığını kontrol et
                 console.warn("Geçersiz araba verisi atlandı:", car);
                 return; 
            }
            const isAdmin = appState.currentUser && appState.currentUser.isAdmin;
            const isFavorited = appState.favoriteCarIds.includes(car.id);
            const isPurchased = appState.purchasedCars.some(p => p.car_id === car.id);

            let adminButtons = '';
            if(isAdmin && sectionType !== 'purchases') {
                adminButtons = `
                    <button onclick="window.openEditCarModal(${car.id})" title="Düzenle" class="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteCar(${car.id})" title="Sil" class="text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors duration-200"><i class="fas fa-trash"></i></button>
                `;
            }
            
            const card = document.createElement('div');
            card.className = 'car-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-200';
            card.innerHTML = `
                <div class="relative">
                    <img src="${car.image_url || 'https://placehold.co/400x250/E1E1E1/444444?text=Resim+Yok'}" alt="${car.brand} ${car.model}" class="w-full h-52 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x250/E1E1E1/444444?text=Resim+Hatas%C4%B1';">
                    ${sectionType !== 'purchases' ? `
                    <button onclick="window.toggleFavorite(${car.id})" title="Favorilere Ekle/Kaldır" class="favorite-btn ${isFavorited ? 'favorited' : ''} absolute top-3 right-3 bg-white bg-opacity-80 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center text-gray-700 hover:text-red-500 transition shadow-md">
                        <i class="fa-heart ${isFavorited ? 'fas' : 'far'} text-xl"></i>
                    </button>` : ''}
                </div>
                <div class="p-5 flex-grow flex flex-col">
                    <div class="flex-grow">
                       <p class="text-xs text-gray-500 mb-1">${car.year}</p>
                       <h3 class="text-lg font-bold text-gray-900 truncate mb-1" title="${car.brand} ${car.model}">${car.brand} ${car.model}</h3>
                       <p class="text-2xl font-semibold text-blue-600 mt-2 mb-3">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits:0 }).format(car.price)}</p>
                    </div>
                    <div class="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            ${ isPurchased 
                                ? `<span class="text-sm font-semibold text-green-600 py-2 px-3 rounded-md bg-green-50 border border-green-200"><i class="fas fa-check-circle mr-1.5"></i>Satın Alındı</span>`
                                : (sectionType !== 'purchases' ? `<button onclick="window.buyCar(${car.id})" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md">Satın Al</button>` : '')
                            }
                        </div>
                        <div class="flex items-center space-x-2">
                            ${adminButtons}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    };

    const fetchAndDisplayCars = async () => {
        const loader = document.getElementById('cars-loader');
        loader.style.display = 'flex';
        carsContainer.innerHTML = '';
        try {
            const cars = await api.get('/cars');
            appState.cars = cars;
            renderCars(carsContainer, appState.cars, 'car-list');
        } catch (error) {
            showMessage(`Arabalar yüklenemedi: ${error.message}`, 'error');
            carsContainer.innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Arabalar yüklenirken bir hata oluştu.</p>`;
        } finally {
            loader.style.display = 'none';
        }
    };

    addCarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = addCarForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="loader !w-5 !h-5 !border-2 !border-t-green-500 mx-auto"></div>`;
        try {
            const payload = {
                brand: document.getElementById('car-brand').value,
                model: document.getElementById('car-model').value,
                year: parseInt(document.getElementById('car-year').value),
                price: parseFloat(document.getElementById('car-price').value),
                image_url: document.getElementById('car-image-url').value,
            };
            const data = await api.post('/cars', payload, appState.authToken);
            appState.cars.unshift(data.car); 
            showMessage('Araba başarıyla eklendi.', 'success');
            addCarForm.reset();
            showSection('car-list');
            renderCars(carsContainer, appState.cars, 'car-list');
        } catch (error) {
            showMessage(`Hata: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    window.openEditCarModal = (carId) => {
        const car = appState.cars.find(c => c.id === carId);
        if(car) {
            document.getElementById('edit-car-id').value = car.id;
            document.getElementById('edit-car-brand').value = car.brand;
            document.getElementById('edit-car-model').value = car.model;
            document.getElementById('edit-car-year').value = car.year;
            document.getElementById('edit-car-price').value = car.price;
            document.getElementById('edit-car-image-url').value = car.image_url;
            document.getElementById('editCarModal').classList.add('is-open');
        } else {
            showMessage("Düzenlenecek araba bulunamadı.", "error");
        }
    };
    
    editCarForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const carId = document.getElementById('edit-car-id').value;
        const submitBtn = editCarForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="loader !w-5 !h-5 !border-2 !border-t-blue-500 mx-auto"></div>`;
        try {
            const payload = {
                brand: document.getElementById('edit-car-brand').value,
                model: document.getElementById('edit-car-model').value,
                year: parseInt(document.getElementById('edit-car-year').value),
                price: parseFloat(document.getElementById('edit-car-price').value),
                image_url: document.getElementById('edit-car-image-url').value,
            };
            const data = await api.put(`/cars/${carId}`, payload, appState.authToken);
            const carIndex = appState.cars.findIndex(c => c.id === parseInt(carId));
            if (carIndex > -1) {
                appState.cars[carIndex] = data.car;
            } else { // Eğer araba listede yoksa (örn. doğrudan ID ile düzenleme denendi) listeye ekle
                appState.cars.push(data.car);
            }
            showMessage('Araba başarıyla güncellendi.', 'success');
            closeModal('editCarModal');
            // Aktif olan bölümü yeniden render et
            const currentVisibleSection = document.querySelector('main section:not(.hidden), .container > section:not(.hidden)')?.id;
            if (currentVisibleSection === 'car-list') renderCars(carsContainer, appState.cars, 'car-list');
            if (currentVisibleSection === 'favorites') displayFavorites(); 
             if (currentVisibleSection === 'purchases') displayPurchases();

        } catch (error) {
             showMessage(`Hata: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });

    window.deleteCar = (carId) => {
         showConfirmation('Bu arabayı kalıcı olarak silmek istediğinizden emin misiniz?', async () => {
            try {
                await api.delete(`/cars/${carId}`, appState.authToken);
                appState.cars = appState.cars.filter(c => c.id !== carId);
                // Favorilerden ve satın alınanlardan da çıkar (eğer ID'leri saklıyorsak)
                appState.favoriteCarIds = appState.favoriteCarIds.filter(id => id !== carId);
                appState.purchasedCars = appState.purchasedCars.filter(p => p.car_id !== carId);

                showMessage('Araba başarıyla silindi.', 'success');
                
                const currentVisibleSection = document.querySelector('main section:not(.hidden), .container > section:not(.hidden)')?.id;
                if (currentVisibleSection === 'car-list') renderCars(carsContainer, appState.cars, 'car-list');
                if (currentVisibleSection === 'favorites') displayFavorites();
                if (currentVisibleSection === 'purchases') displayPurchases();

            } catch (error) {
                 showMessage(`Hata: ${error.message}`, 'error');
            }
         });
    };
    
    window.toggleFavorite = async (carId) => {
        if (!appState.currentUser) {
            showMessage('Favorilere eklemek için giriş yapmalısınız.');
            return;
        }
        try {
            const data = await api.post(`/user/favorites/${carId}`, {}, appState.authToken);
            if (data.favorited) {
                appState.favoriteCarIds.push(carId);
            } else {
                appState.favoriteCarIds = appState.favoriteCarIds.filter(id => id !== carId);
            }
            
            const currentVisibleSection = document.querySelector('main section:not(.hidden), .container > section:not(.hidden)')?.id;
            if (currentVisibleSection === 'car-list') renderCars(carsContainer, appState.cars, 'car-list');
            if (currentVisibleSection === 'favorites') displayFavorites();
            // Satın alınanlar listesi favori durumundan etkilenmez ama araba kartı güncellenmeli
            if (currentVisibleSection === 'purchases') {
                const purchasedCarsDetailsList = appState.purchasedCars.map(purchase => {
                    return appState.cars.find(c => c.id === purchase.car_id);
                }).filter(Boolean);
                renderCars(purchasesContainer, purchasedCarsDetailsList, 'purchases');
            }


        } catch (error) {
            showMessage(`Hata: ${error.message}`, 'error');
        }
    };

    const displayFavorites = async () => {
        const loader = document.getElementById('favorites-loader');
        const noFavsMsg = document.getElementById('no-favorites-message');
        loader.style.display = 'flex';
        favoritesContainer.innerHTML = '';
        noFavsMsg.classList.add('hidden');

        if (!appState.currentUser) {
            noFavsMsg.classList.remove('hidden');
            noFavsMsg.querySelector('p.text-2xl').textContent = 'Favorilerinizi görmek için giriş yapmalısınız.';
            loader.style.display = 'none';
            return;
        }

        try {
            if(appState.cars.length === 0) { 
                const carsData = await api.get('/cars'); // Tüm arabaları çek
                appState.cars = carsData;
            }
            
            appState.favoriteCarIds = await api.get('/user/favorites', appState.authToken);
            const favoriteCarsList = appState.cars.filter(car => appState.favoriteCarIds.includes(car.id));
            
            if (favoriteCarsList.length === 0) {
                noFavsMsg.classList.remove('hidden');
                noFavsMsg.querySelector('p.text-2xl').textContent = 'Favori Listeniz Boş';
            } else {
                renderCars(favoritesContainer, favoriteCarsList, 'favorites');
            }
        } catch (error) {
            showMessage(`Favoriler yüklenemedi: ${error.message}`, 'error');
            noFavsMsg.classList.remove('hidden');
            noFavsMsg.querySelector('p.text-2xl').textContent = 'Favoriler yüklenirken bir hata oluştu.';
        } finally {
            loader.style.display = 'none';
        }
    };

    window.buyCar = (carId) => {
        if (!appState.currentUser) {
            showMessage('Satın almak için giriş yapmalısınız.');
            return;
        }
        const car = appState.cars.find(c => c.id === carId);
        if (!car) {
            showMessage('Araba bulunamadı.', 'error');
            return;
        }
        showConfirmation(`${car.brand} ${car.model} modelini ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0, maximumFractionDigits:0 }).format(car.price)} fiyatına satın almak istediğinize emin misiniz?`, async () => {
            try {
                const data = await api.post(`/user/purchases/${carId}`, {}, appState.authToken);
                // Backend'den dönen purchase objesi {id, user_id, car_id, purchase_price, purchased_at} şeklinde olmalı
                // Eğer appState.purchasedCars sadece ID'leri tutuyorsa, backend'den dönen car_id'yi ekleyebiliriz.
                // Ya da backend'den dönen tam purchase objesini ekleyebiliriz.
                // Şu anki backend /api/user/purchases/:carId rotası { message, purchase } döndürüyor. purchase objesi car_id içeriyor.
                appState.purchasedCars.push(data.purchase); // Backend'den dönen purchase objesini ekle
                showMessage('Araba başarıyla satın alındı!', 'success');
                
                const currentVisibleSection = document.querySelector('main section:not(.hidden), .container > section:not(.hidden)')?.id;
                if (currentVisibleSection === 'car-list') renderCars(carsContainer, appState.cars, 'car-list');
                if (currentVisibleSection === 'favorites') displayFavorites(); 
            } catch (error) {
                showMessage(`Hata: ${error.message}`, 'error');
            }
        });
    };
    
    const displayPurchases = async () => {
        const loader = document.getElementById('purchases-loader');
        const noPurchasesMsg = document.getElementById('no-purchases-message');
        loader.style.display = 'flex';
        purchasesContainer.innerHTML = '';
        noPurchasesMsg.classList.add('hidden');

        if (!appState.currentUser) {
            noPurchasesMsg.classList.remove('hidden');
            noPurchasesMsg.querySelector('p.text-2xl').textContent = 'Satın aldıklarınızı görmek için giriş yapmalısınız.';
            loader.style.display = 'none';
            return;
        }

        try {
            if(appState.cars.length === 0) { 
                 const carsData = await api.get('/cars'); // Tüm arabaları çek
                 appState.cars = carsData;
            }
            
            appState.purchasedCars = await api.get('/user/purchases', appState.authToken); // Bu [{car_id, purchase_price, purchased_at}, ...] döndürüyor
            
            const purchasedCarsDetailsList = appState.purchasedCars.map(purchase => {
                const carDetail = appState.cars.find(c => c.id === purchase.car_id);
                if (carDetail) {
                    // Satın alma bilgilerini araba objesine ekleyebiliriz, ama renderCars bunu beklemiyor.
                    // Şimdilik sadece araba detayını renderCars'a yollayalım.
                    return {...carDetail, purchaseInfo: purchase}; // Orijinal araba objesini değiştirmemek için kopyala
                }
                return null; 
            }).filter(Boolean); 
            
            if (purchasedCarsDetailsList.length === 0) {
                noPurchasesMsg.classList.remove('hidden');
                 noPurchasesMsg.querySelector('p.text-2xl').textContent = 'Henüz Satın Alınan Araç Yok';
            } else {
                renderCars(purchasesContainer, purchasedCarsDetailsList, 'purchases');
            }
        } catch (error) {
            showMessage(`Satın alınanlar yüklenemedi: ${error.message}`, 'error');
            noPurchasesMsg.classList.remove('hidden');
            noPurchasesMsg.querySelector('p.text-2xl').textContent = 'Satın alınanlar yüklenirken bir hata oluştu.';
        } finally {
            loader.style.display = 'none';
        }
    };
    
    const displayUserProfile = async () => {
        if (!appState.currentUser) {
            showSection('user-auth');
            return;
        }
        try {
            const profile = await api.get('/user/profile', appState.authToken);
            document.getElementById('profile-username').textContent = profile.username;
            document.getElementById('profile-email').textContent = profile.email;
            const roleBadge = document.getElementById('profile-role');
            roleBadge.textContent = profile.is_admin ? 'Yönetici' : 'Üye';
            roleBadge.className = `px-3 py-1 text-sm font-semibold rounded-full ${profile.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`;

            if (profile.is_admin) {
                document.getElementById('admin-user-management').classList.remove('hidden');
                displayUserManagementList();
            } else {
                document.getElementById('admin-user-management').classList.add('hidden');
            }
        } catch (error) {
            showMessage(`Profil bilgileri yüklenemedi: ${error.message}`, 'error');
             if (error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('yetki')) { 
                logout();
            }
        }
    };
    
    const displayUserManagementList = async () => {
        const loader = document.getElementById('user-management-loader');
        loader.style.display = 'flex';
        userListBody.innerHTML = '';
         try {
            const users = await api.get('/admin/users', appState.authToken);
            if (users.length === 0) {
                userListBody.innerHTML = '<tr><td colspan="4" class="py-4 px-5 text-center text-gray-500">Kayıtlı kullanıcı bulunmamaktadır.</td></tr>';
            } else {
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 transition-colors duration-150';
                    row.innerHTML = `
                        <td class="py-3 px-5">${user.username}</td>
                        <td class="py-3 px-5">${user.email}</td>
                        <td class="py-3 px-5">
                            <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${user.is_admin ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                                ${user.is_admin ? 'Yönetici' : 'Üye'}
                            </span>
                        </td>
                        <td class="py-3 px-5 text-center">
                            ${user.id !== appState.currentUser.id && !user.is_admin 
                                ? `<button onclick="window.deleteUser(${user.id})" title="Kullanıcıyı Sil" class="text-red-500 hover:text-red-700 transition-colors duration-150"><i class="fas fa-user-times"></i></button>` 
                                : (user.id === appState.currentUser.id ? '<span class="text-xs text-gray-400">(Kendiniz)</span>' : '<span class="text-xs text-gray-400">(Yönetici)</span>')
                            }
                        </td>
                    `;
                    userListBody.appendChild(row);
                });
            }
         } catch (error) {
            showMessage(`Kullanıcı listesi yüklenemedi: ${error.message}`, 'error');
            userListBody.innerHTML = '<tr><td colspan="4" class="py-4 px-5 text-center text-red-500">Kullanıcı listesi yüklenirken bir hata oluştu.</td></tr>';
         } finally {
            loader.style.display = 'none';
         }
    };
    
    window.deleteUser = (userId) => {
        showConfirmation(`Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`, async () => {
            try {
                await api.delete(`/admin/users/${userId}`, appState.authToken);
                showMessage('Kullanıcı başarıyla silindi.', 'success');
                displayUserManagementList(); 
            } catch (error) {
                showMessage(`Hata: ${error.message}`, 'error');
            }
        });
    };
    
    userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Olayın document'e yayılmasını engelle
        userMenuDropdown.classList.toggle('hidden');
        userMenuButton.setAttribute('aria-expanded', userMenuDropdown.classList.contains('hidden') ? 'false' : 'true');
    });

    mobileMenuButton.addEventListener('click', () => {
        const expanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false;
        mobileMenuButton.setAttribute('aria-expanded', !expanded);
        mobileMenu.classList.toggle('hidden');
        if (!expanded) {
            mobileMenuIcon.classList.remove('fa-bars');
            mobileMenuIcon.classList.add('fa-times');
        } else {
            mobileMenuIcon.classList.remove('fa-times');
            mobileMenuIcon.classList.add('fa-bars');
        }
    });

    document.addEventListener('click', (e) => {
        // Kullanıcı menüsü dışına tıklanırsa kapat
        if (loggedInView.contains(e.target) && !userMenuButton.contains(e.target) && !userMenuDropdown.contains(e.target) && !userMenuDropdown.classList.contains('hidden')) {
             // Eğer menü içindeki bir linke tıklandıysa kapatma (showSection halleder)
            if (!e.target.closest('#user-menu-dropdown a')) {
                 userMenuDropdown.classList.add('hidden');
                 userMenuButton.setAttribute('aria-expanded', 'false');
            }
        } else if (!loggedInView.contains(e.target) && !userMenuDropdown.classList.contains('hidden')) {
             userMenuDropdown.classList.add('hidden');
             userMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Dropdown içindeki linklere tıklandığında dropdown'ı kapat
    document.querySelectorAll('#user-menu-dropdown a').forEach(link => {
        link.addEventListener('click', () => {
            userMenuDropdown.classList.add('hidden');
            userMenuButton.setAttribute('aria-expanded', 'false');
        });
    });


    const initializeApp = () => {
        checkInitialAuth();
        showSection('home');
    };

    initializeApp();
});
