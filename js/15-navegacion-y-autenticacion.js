    // =============================================================
    // 🧭 NAVEGACIÓN ENTRE SECCIONES
    // =============================================================

    function cambiarSeccion(seccion) {
        if (!weekContent || !diferidosContent || !libroContent) {
            console.error('❌ Elementos del DOM no encontrados');
            return;
        }

        weekContent.style.display = 'none';
        diferidosContent.style.display = 'none';
        libroContent.style.display = 'none';
        adminContent.style.display = 'none';
        manualContent.style.display = 'none'; 

        const tabContainer = document.getElementById('tabContainer');
        const daysGrid = document.querySelector('.days-grid');
        const weekContainer = document.querySelector('.week-container');

        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        if (seccion === 'registro') {
            weekContent.style.display = 'block';
            if (navRegistro) navRegistro.classList.add('active');
            seccionActiva = 'registro';
            if (tabContainer) tabContainer.style.display = 'flex';
            if (daysGrid) daysGrid.style.display = 'grid';
            if (weekContainer) weekContainer.style.display = 'block';
            renderWeekView();

        } else if (seccion === 'diferidos') {
            diferidosContent.style.display = 'block';
            if (navDiferidos) navDiferidos.classList.add('active');
            seccionActiva = 'diferidos';
            if (tabContainer) tabContainer.style.display = 'none';
            if (daysGrid) daysGrid.style.display = 'none';
            if (weekContainer) weekContainer.style.display = 'none';
            cargarPacientesDiferidos();

        } else if (seccion === 'libro') {
            libroContent.style.display = 'block';
            if (navLibro) navLibro.classList.add('active');
            seccionActiva = 'libro';
            if (tabContainer) tabContainer.style.display = 'none';
            if (daysGrid) daysGrid.style.display = 'none';
            if (weekContainer) weekContainer.style.display = 'none';
            cargarLibroQuirofano();

        } else if (seccion === 'admin') {
            adminContent.style.display = 'block';
            if (navAdmin) navAdmin.classList.add('active');
            seccionActiva = 'admin';
            if (tabContainer) tabContainer.style.display = 'none';
            if (daysGrid) daysGrid.style.display = 'none';
            if (weekContainer) weekContainer.style.display = 'none';
            cargarAdmin();

        } else if (seccion === 'manual') {
            manualContent.style.display = 'block';
            if (navManual) navManual.classList.add('active');
            seccionActiva = 'manual';
            if (tabContainer) tabContainer.style.display = 'none';
            if (daysGrid) daysGrid.style.display = 'none';
            if (weekContainer) weekContainer.style.display = 'none';
            cargarManual();
}



        if (menuDropdown && menuToggle) {
            menuDropdown.classList.remove('open');
            menuToggle.classList.remove('active');
        }
    }

    // =============================================================
    // 🛡️ VERIFICAR SI EL USUARIO ES ADMINISTRADOR
    // =============================================================
    function esAdministrador() {
        if (typeof currentUserRol === 'undefined' || !currentUserRol) {
            return false;
        }
        return currentUserRol === 'administrador';
    }

    // =============================================================
    // 🚪 CERRAR SESIÓN
    // =============================================================
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        const confirmed = await showModal({
            title: '🚪 Cerrar Sesión',
            message: '¿Estás seguro de que deseas cerrar la sesión?<br>Los cambios no guardados se perderán.',
            icon: '🚪',
            confirmText: 'Sí, cerrar sesión',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            detenerSincronizacionTiempoReal();
            detenerAutoSave(); // ← AGREGAR ESTA LÍNEA
            await auth.signOut();

            currentUser = null;
            currentUserEmail = '';
            currentUserRol = '';

            document.getElementById('userInfo').style.display = 'none';
            loginContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            appContainer.classList.remove('visible');
            loginEmail.value = '';
            loginPassword.value = '';
            loginStatus.textContent = '';

            document.getElementById('weekContent').innerHTML = '';

            console.log('✅ Sesión cerrada');
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            showModal({
                title: '❌ Error',
                message: 'Hubo un problema al cerrar la sesión. Intenta nuevamente.',
                icon: '❌',
                confirmText: 'Aceptar'
            });
        }
    });

    // =============================================================
    // 🔐 AUTENTICACIÓN DE USUARIOS
    // =============================================================

    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('app');
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginStatus = document.getElementById('loginStatus');

    function mostrarLoginStatus(mensaje, tipo = 'error') {
        loginStatus.textContent = mensaje;
        loginStatus.className = 'login-status ' + tipo;
    }

    async function iniciarSesion(email, password) {
        try {
            mostrarLoginStatus('⏳ Verificando credenciales...', '');

            // Solo autenticamos aquí. Firebase disparará automáticamente
            // auth.onAuthStateChanged() justo después de un login exitoso,
            // y es ESE listener el único responsable de inicializar la app
            // (cargar datos, desplegables, sincronización, autoguardado y render).
            // Antes esta función duplicaba toda esa inicialización, causando
            // que se registraran listeners y temporizadores dos veces.
            await auth.signInWithEmailAndPassword(email, password);

        } catch (error) {
            console.error('❌ Error al iniciar sesión:', error);
            let mensaje = '❌ Error al iniciar sesión';
            if (error.code === 'auth/user-not-found') {
                mensaje = '❌ Usuario no encontrado';
            } else if (error.code === 'auth/wrong-password') {
                mensaje = '❌ Contraseña incorrecta';
            } else if (error.code === 'auth/invalid-email') {
                mensaje = '❌ Correo electrónico inválido';
            } else if (error.code === 'auth/too-many-requests') {
                mensaje = '❌ Demasiados intentos. Espera un momento.';
            }
            mostrarLoginStatus(mensaje, 'error');
        }
    }

    loginBtn.addEventListener('click', function() {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            mostrarLoginStatus('❌ Ingresa tu correo y contraseña', 'error');
            return;
        }

        iniciarSesion(email, password);
    });

    loginEmail.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            loginPassword.focus();
        }
    });

    loginPassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    auth.onAuthStateChanged(async function(user) {
        if (user) {
            currentUser = user;
            currentUserEmail = user.email;

            const userRef = database.ref('usuarios/' + user.uid);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (userData && userData.rol) {
                currentUserRol = userData.rol;
            } else {
                // Usuario nuevo sin rol asignado: se crea con rol por defecto
                // (misma lógica que antes vivía duplicada en iniciarSesion()).
                currentUserRol = 'usuario';
                await userRef.update({ rol: 'usuario', email: currentUserEmail });
            }

            console.log('✅ Usuario autenticado:', currentUserEmail, 'Rol:', currentUserRol);

            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            appContainer.classList.add('visible');

            const userInfoDiv = document.getElementById('userInfo');
            const userDisplaySpan = document.getElementById('userDisplayName');
            userInfoDiv.style.display = 'flex';
            userDisplaySpan.textContent = '👤 ' + currentUserEmail;

            cargarDatosDesdeFirebase();
            await cargarDesplegablesCache();
            iniciarSincronizacionTiempoReal();
            iniciarAutoSave();
            render();

        } else {
            currentUser = null;
            currentUserEmail = '';
            currentUserRol = '';
            loginContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            appContainer.classList.remove('visible');
            loginEmail.value = '';
            loginPassword.value = '';
            loginStatus.textContent = '';

            document.getElementById('userInfo').style.display = 'none';
        }
    });

    // =============================================================
    // EVENTOS DE NAVEGACIÓN DEL MENÚ
    // =============================================================
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        menuDropdown.classList.toggle('open');
        this.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        const menu = document.querySelector('.menu-hamburguesa');
        if (menu && !menu.contains(e.target)) {
            menuDropdown.classList.remove('open');
            menuToggle.classList.remove('active');
        }
    });

    navRegistro.addEventListener('click', function() {
        cambiarSeccion('registro');
    });

    navDiferidos.addEventListener('click', function() {
        cambiarSeccion('diferidos');
    });

    if (navLibro) {
        navLibro.addEventListener('click', function() {
            cambiarSeccion('libro');
        });
    }

    if (navAdmin) {
        navAdmin.addEventListener('click', function() {
            cambiarSeccion('admin');
        });
    }

    if (navManual) {
    navManual.addEventListener('click', function() {
        cambiarSeccion('manual');
    });
}
