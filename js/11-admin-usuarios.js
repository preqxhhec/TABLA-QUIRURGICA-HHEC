

    // =============================================================
    // 👥 GESTIÓN DE USUARIOS
    // =============================================================
    async function cargarUsuarios() {
        const contenedor = document.getElementById('usuariosLista');
        if (!contenedor) return;

        try {
            const snapshot = await database.ref('usuarios').once('value');
            const data = snapshot.val();

            if (!data) {
                contenedor.innerHTML = `
                    <p style="color:#94a3b8; text-align:center; padding:20px;">No hay usuarios registrados.</p>
                `;
                return;
            }

            let html = `
                <div class="table-wrap" style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                        <thead>
                            <tr style="background:#f8fafc;">
                                <th style="padding:8px 10px; text-align:left; border-bottom:2px solid #e2e8f0;">Email</th>
                                <th style="padding:8px 10px; text-align:center; border-bottom:2px solid #e2e8f0;">Rol</th>
                                <th style="padding:8px 10px; text-align:center; border-bottom:2px solid #e2e8f0;">Estado</th>
                                <th style="padding:8px 10px; text-align:center; border-bottom:2px solid #e2e8f0;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            Object.keys(data).forEach(uid => {
                const user = data[uid];
                const email = user.email || 'Sin email';
                const rol = user.rol || 'usuario';
                const activo = user.activo !== false;
                const esUsuarioActual = uid === currentUser.uid;

                html += `
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:8px 10px; text-align:left;">
                            ${email}
                            ${esUsuarioActual ? ' <span style="font-size:0.6rem; background:#e8f4fd; padding:2px 8px; border-radius:10px; color:#1e293b;">(tú)</span>' : ''}
                        </td>
                        <td style="padding:8px 10px; text-align:center;">
                            <select class="cambiar-rol" data-uid="${uid}" style="padding:4px 8px; border:1px solid #d1d9e6; border-radius:4px; font-size:0.75rem; ${esUsuarioActual ? 'disabled' : ''}">
                                <option value="usuario" ${rol === 'usuario' ? 'selected' : ''}>Usuario</option>
                                <option value="administrador" ${rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </td>
                        <td style="padding:8px 10px; text-align:center;">
                            ${esUsuarioActual ? 
                                '<span style="color:#64748b;">-</span>' :
                                `<button class="btn-toggle-estado" data-uid="${uid}" data-activo="${activo}" style="padding:4px 12px; border:none; border-radius:20px; cursor:pointer; font-size:0.7rem; font-weight:500; ${activo ? 'background:#dcfce7; color:#166534;' : 'background:#fee2e2; color:#991b1b;'}">
                                    ${activo ? '✅ Activo' : '❌ Bloqueado'}
                                </button>`
                            }
                        </td>
                        <td style="padding:8px 10px; text-align:center;">
                            ${esUsuarioActual ? 
                                '<span style="color:#94a3b8; font-size:0.7rem;">No puedes modificarte</span>' :
                                `<button class="btn-eliminar-usuario" data-uid="${uid}" data-email="${email}" style="background:transparent; border:1px solid #ef4444; border-radius:4px; padding:2px 8px; cursor:pointer; color:#ef4444; font-size:0.8rem;">🗑️</button>`
                            }
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            contenedor.innerHTML = html;

            document.querySelectorAll('.cambiar-rol').forEach(select => {
                select.addEventListener('change', function() {
                    const uid = this.dataset.uid;
                    const nuevoRol = this.value;
                    cambiarRolUsuario(uid, nuevoRol);
                });
            });

            document.querySelectorAll('.btn-toggle-estado').forEach(btn => {
                btn.addEventListener('click', function() {
                    const uid = this.dataset.uid;
                    const estadoActual = this.dataset.activo === 'true';
                    toggleEstadoUsuario(uid, estadoActual);
                });
            });

            document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
                btn.addEventListener('click', function() {
                    const uid = this.dataset.uid;
                    const email = this.dataset.email;
                    eliminarUsuario(uid, email);
                });
            });

        } catch (error) {
            console.error('❌ Error al cargar usuarios:', error);
            contenedor.innerHTML = `
                <p style="color:#dc2626; text-align:center; padding:20px;">Error al cargar usuarios. Intenta nuevamente.</p>
            `;
        }
    }

    async function cambiarRolUsuario(uid, nuevoRol) {
        if (!currentUser || currentUserRol !== 'administrador') {
            showModal({
                title: '⛔ Acceso denegado',
                message: 'Solo los administradores pueden cambiar roles.',
                icon: '⛔',
                confirmText: 'Aceptar'
            });
            return;
        }

        try {
            await database.ref('usuarios/' + uid + '/rol').set(nuevoRol);
            showModal({
                title: '✅ Rol actualizado',
                message: `El rol ha sido cambiado a <strong>${nuevoRol}</strong>.`,
                icon: '✅',
                confirmText: 'Aceptar'
            });
            cargarUsuarios();
        } catch (error) {
            console.error('❌ Error al cambiar rol:', error);
            showModal({
                title: '❌ Error',
                message: 'Hubo un problema al cambiar el rol.<br>Intenta nuevamente.',
                icon: '❌',
                confirmText: 'Aceptar'
            });
        }
    }

    async function toggleEstadoUsuario(uid, estadoActual) {
        if (!currentUser || currentUserRol !== 'administrador') {
            showModal({
                title: '⛔ Acceso denegado',
                message: 'Solo los administradores pueden bloquear/activar usuarios.',
                icon: '⛔',
                confirmText: 'Aceptar'
            });
            return;
        }

        const nuevoEstado = !estadoActual;
        const accion = nuevoEstado ? 'activar' : 'bloquear';

        const confirmado = await showModal({
            title: `⚠️ ${accion === 'activar' ? 'Activar' : 'Bloquear'} usuario`,
            message: `¿Estás seguro de que deseas <strong>${accion}</strong> este usuario?`,
            icon: '⚠️',
            confirmText: `✅ ${accion === 'activar' ? 'Activar' : 'Bloquear'}`,
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmado) return;

        try {
            await database.ref('usuarios/' + uid + '/activo').set(nuevoEstado);
            showModal({
                title: '✅ Usuario actualizado',
                message: `El usuario ha sido <strong>${accion}ado</strong> correctamente.`,
                icon: '✅',
                confirmText: 'Aceptar'
            });
            cargarUsuarios();
        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            showModal({
                title: '❌ Error',
                message: 'Hubo un problema al cambiar el estado.<br>Intenta nuevamente.',
                icon: '❌',
                confirmText: 'Aceptar'
            });
        }
    }

    async function eliminarUsuario(uid, email) {
        if (!currentUser || currentUserRol !== 'administrador') {
            showModal({
                title: '⛔ Acceso denegado',
                message: 'Solo los administradores pueden eliminar usuarios.',
                icon: '⛔',
                confirmText: 'Aceptar'
            });
            return;
        }

        const confirmado = await showModal({
            title: '🗑️ Eliminar usuario',
            message: `¿Estás seguro de que deseas eliminar al usuario <strong>${email}</strong>?<br><br><strong>Esta acción no se puede deshacer.</strong>`,
            icon: '🗑️',
            confirmText: '✅ Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmado) return;

        try {
            await database.ref('usuarios/' + uid).remove();

            showModal({
                title: '✅ Usuario eliminado',
                message: `El usuario <strong>${email}</strong> ha sido eliminado.`,
                icon: '✅',
                confirmText: 'Aceptar'
            });
            cargarUsuarios();
        } catch (error) {
            console.error('❌ Error al eliminar usuario:', error);
            showModal({
                title: '❌ Error',
                message: 'Hubo un problema al eliminar el usuario.<br>Intenta nuevamente.',
                icon: '❌',
                confirmText: 'Aceptar'
            });
        }
    }

    function mostrarModalCrearUsuario() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 450px;">
                <span class="modal-icon">👤</span>
                <div class="modal-title">Crear Nuevo Usuario</div>
                <div class="modal-message">
                    Ingresa los datos del nuevo usuario:
                </div>
                <div style="text-align:left; margin-bottom:16px;">
                    <label style="font-size:0.8rem; font-weight:600; color:#475569; display:block; margin-bottom:4px;">Correo electrónico</label>
                    <input type="email" id="nuevoUsuarioEmail" placeholder="ejemplo@hospital.cl" style="width:100%; padding:10px 12px; border:2px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;">
                    
                    <label style="font-size:0.8rem; font-weight:600; color:#475569; display:block; margin-top:12px; margin-bottom:4px;">Contraseña</label>
                    <input type="password" id="nuevoUsuarioPassword" placeholder="Mínimo 6 caracteres" style="width:100%; padding:10px 12px; border:2px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;">
                    
                    <label style="font-size:0.8rem; font-weight:600; color:#475569; display:block; margin-top:12px; margin-bottom:4px;">Rol</label>
                    <select id="nuevoUsuarioRol" style="width:100%; padding:10px 12px; border:2px solid #e2e8f0; border-radius:8px; font-size:0.95rem; box-sizing:border-box;">
                        <option value="usuario">Usuario</option>
                        <option value="administrador">Administrador</option>
                    </select>
                    
                    <div id="nuevoUsuarioError" style="color:#dc2626; font-size:0.85rem; margin-top:8px; min-height:20px;"></div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" id="crearUsuarioCancelar">Cancelar</button>
                    <button class="modal-btn modal-btn-success" id="crearUsuarioConfirmar">✅ Crear</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const emailInput = overlay.querySelector('#nuevoUsuarioEmail');
        const passInput = overlay.querySelector('#nuevoUsuarioPassword');
        const rolSelect = overlay.querySelector('#nuevoUsuarioRol');
        const errorDiv = overlay.querySelector('#nuevoUsuarioError');
        const confirmarBtn = overlay.querySelector('#crearUsuarioConfirmar');
        const cancelarBtn = overlay.querySelector('#crearUsuarioCancelar');

        confirmarBtn.addEventListener('click', async function() {
            const email = emailInput.value.trim();
            const password = passInput.value.trim();
            const rol = rolSelect.value;

            if (!email) {
                errorDiv.textContent = '❌ Ingresa un correo electrónico';
                return;
            }
            if (!password || password.length < 6) {
                errorDiv.textContent = '❌ La contraseña debe tener al menos 6 caracteres';
                return;
            }

            errorDiv.textContent = '⏳ Creando usuario...';
            confirmarBtn.disabled = true;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                await database.ref('usuarios/' + user.uid).set({
                    email: email,
                    rol: rol,
                    activo: true,
                    creado_por: currentUserEmail,
                    fecha_creacion: firebase.database.ServerValue.TIMESTAMP
                });

                showModal({
                    title: '✅ Usuario creado',
                    message: `El usuario <strong>${email}</strong> ha sido creado con rol <strong>${rol}</strong>.`,
                    icon: '✅',
                    confirmText: 'Aceptar'
                });

                const box = overlay.querySelector('.modal-box');
                box.classList.add('closing');
                overlay.classList.add('closing');
                setTimeout(() => overlay.remove(), 300);

                cargarUsuarios();

            } catch (error) {
                console.error('❌ Error al crear usuario:', error);
                let mensaje = '❌ Error al crear el usuario';
                if (error.code === 'auth/email-already-in-use') {
                    mensaje = '❌ Este correo ya está registrado';
                } else if (error.code === 'auth/invalid-email') {
                    mensaje = '❌ Correo electrónico inválido';
                } else if (error.code === 'auth/weak-password') {
                    mensaje = '❌ La contraseña es muy débil (mínimo 6 caracteres)';
                }
                errorDiv.textContent = mensaje;
                confirmarBtn.disabled = false;
            }
        });

        cancelarBtn.addEventListener('click', function() {
            const box = overlay.querySelector('.modal-box');
            box.classList.add('closing');
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                const box = overlay.querySelector('.modal-box');
                box.classList.add('closing');
                overlay.classList.add('closing');
                setTimeout(() => overlay.remove(), 300);
            }
        });
    }