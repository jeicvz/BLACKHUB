// public/js/main.js
document.addEventListener("DOMContentLoaded", () => {

    // --- FUNCIÓN PARA OBTENER USUARIO GUARDADO ---
    function obtenerUsuarioGuardado() {
        const usuarioGuardado = localStorage.getItem('usuarioBlackhub');

        if (!usuarioGuardado) {
            return null;
        }

        try {
            return JSON.parse(usuarioGuardado);
        } catch (error) {
            localStorage.removeItem('usuarioBlackhub');
            return null;
        }
    }

    // --- FUNCIÓN PARA OBTENER LA FECHA ACTUAL EN FORMATO YYYY-MM-DD ---
    function obtenerFechaActualTexto() {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');

        return `${yyyy}-${mm}-${dd}`;
    }

    // --- 1. LÓGICA DE LA BARRA DE NAVEGACIÓN ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');

        if (currentPath === linkPath || (currentPath === '/' && linkPath === '/index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // --- 2. VERIFICAR SESIÓN ACTIVA ---
    const authContainer = document.querySelector('.auth-buttons');
    const usuarioActual = obtenerUsuarioGuardado();

    if (authContainer && usuarioActual) {
        const horaActual = new Date().getHours();
        let saludo = '';

        if (horaActual >= 6 && horaActual < 12) {
            saludo = 'Buenos días';
        } else if (horaActual >= 12 && horaActual < 19) {
            saludo = 'Buenas tardes';
        } else {
            saludo = 'Buenas noches';
        }

        authContainer.innerHTML = `
            <span style="color: #cccccc; font-family: 'Oswald', sans-serif; font-size: 17px; margin-right: 15px; display: flex; align-items: center; letter-spacing: 1px;">
                ¡${saludo}, ${usuarioActual.Nombre}!
            </span>
            <a href="#" id="btnCerrarSesion" class="btn-outline-silver">Cerrar Sesión</a>
        `;

        const btnCerrarSesion = document.getElementById('btnCerrarSesion');

        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();

                Swal.fire({
                    title: '¿Cerrar sesión?',
                    text: 'Tendrás que volver a ingresar para agendar citas.',
                    icon: 'warning',
                    showCancelButton: true,
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#222222',
                    confirmButtonText: 'Sí, salir',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.removeItem('usuarioBlackhub');
                        window.location.href = '/index.html';
                    }
                });
            });
        }
    }

    // --- 3. BLOQUEAR CLIC EN AGENDAR SI NO HAY SESIÓN ---
    const enlacesAgendar = document.querySelectorAll('a[href="/agendar.html"]');

    enlacesAgendar.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            const usuario = obtenerUsuarioGuardado();

            if (!usuario && window.location.pathname !== '/agendar.html') {
                e.preventDefault();

                Swal.fire({
                    title: 'Inicia sesión',
                    text: 'Para agendar una cita primero debes iniciar sesión.',
                    icon: 'info',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37',
                    confirmButtonText: 'Ir al login',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar',
                    cancelButtonColor: '#222222'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/login.html';
                    }
                });
            }
        });
    });

    // --- 4. LÓGICA DE REGISTRO ---
    const formRegistro = document.getElementById('formRegistro');

    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value.trim();
            const apellido = document.getElementById('apellido').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!nombre || !apellido || !correo || !password) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Completa todos los campos para crear tu cuenta.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
                return;
            }

            try {
                const respuesta = await fetch('/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre,
                        apellido,
                        correo,
                        password
                    })
                });

                const data = await respuesta.json();

                if (data.success) {
                    Swal.fire({
                        title: '¡Excelente!',
                        text: data.mensaje,
                        icon: 'success',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#D4AF37',
                        confirmButtonText: 'Ir al Login'
                    }).then(() => {
                        window.location.href = '/login.html';
                    });
                } else {
                    Swal.fire({
                        title: 'Oops...',
                        text: data.mensaje,
                        icon: 'warning',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#D4AF37'
                    });
                }

            } catch (error) {
                console.error('Error en registro:', error);

                Swal.fire({
                    title: 'Error de conexión',
                    text: 'Asegúrate de que el servidor esté corriendo.',
                    icon: 'error',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
            }
        });
    }

    // --- 5. LÓGICA DE INICIAR SESIÓN ---
    const formLogin = document.getElementById('formLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correo').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!correo || !password) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Ingresa tu correo y contraseña.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
                return;
            }

            try {
                const respuesta = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        correo,
                        password
                    })
                });

                const data = await respuesta.json();

                if (data.success) {
                    localStorage.setItem('usuarioBlackhub', JSON.stringify(data.usuario));

                    Swal.fire({
                        title: '¡Acceso concedido!',
                        text: `Bienvenido a The Black Studio, ${data.usuario.Nombre}.`,
                        icon: 'success',
                        background: '#121212',
                        color: '#ffffff',
                        showConfirmButton: false,
                        timer: 2000
                    }).then(() => {
                        if (data.usuario.Rol === 'admin') {
                            window.location.href = '/admin.html';
                        } else {
                            window.location.href = '/index.html';
                        }
                    });

                } else {
                    Swal.fire({
                        title: 'Acceso denegado',
                        text: data.mensaje,
                        icon: 'error',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#D4AF37'
                    });
                }

            } catch (error) {
                console.error('Error en login:', error);

                Swal.fire({
                    title: 'Error de servidor',
                    text: 'Asegúrate de que el backend esté conectado a SQL Server.',
                    icon: 'error',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
            }
        });
    }

    // --- 6. LÓGICA DE LA PÁGINA AGENDAR ---
    const agendarLoginBox = document.getElementById('agendarLoginBox');
    const agendarFormBox = document.getElementById('agendarFormBox');
    const nombreUsuarioAgenda = document.getElementById('nombreUsuarioAgenda');
    const formAgendar = document.getElementById('formAgendar');
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');

    if (agendarLoginBox && agendarFormBox) {
        const usuario = obtenerUsuarioGuardado();

        if (!usuario) {
            agendarLoginBox.style.display = 'block';
            agendarFormBox.style.display = 'none';
        } else {
            agendarLoginBox.style.display = 'none';
            agendarFormBox.style.display = 'block';

            if (nombreUsuarioAgenda) {
                nombreUsuarioAgenda.textContent = `${usuario.Nombre} ${usuario.Apellido}`;
            }
        }
    }

    // Generar horarios de 11:00 AM a 8:00 PM, con intervalos de 1 hora
    function generarHorarios(inicio, fin) {
        const horarios = [];

        let [horaInicio, minutoInicio] = inicio.split(':').map(Number);
        let [horaFin, minutoFin] = fin.split(':').map(Number);

        let fechaBase = new Date();
        fechaBase.setHours(horaInicio, minutoInicio, 0, 0);

        let fechaFin = new Date();
        fechaFin.setHours(horaFin, minutoFin, 0, 0);

        while (fechaBase <= fechaFin) {
            let horas = fechaBase.getHours();
            let minutos = fechaBase.getMinutes();

            let hora24 = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

            let periodo = horas >= 12 ? 'PM' : 'AM';
            let horas12 = horas % 12 || 12;
            let minutosTexto = String(minutos).padStart(2, '0');
            let horaVisible = `${horas12}:${minutosTexto} ${periodo}`;

            horarios.push({
                valor: hora24,
                texto: horaVisible
            });

            fechaBase.setMinutes(fechaBase.getMinutes() + 60);
        }

        return horarios;
    }

    // Mostrar horarios disponibles dependiendo de la fecha seleccionada
    if (fechaInput && horaSelect) {
        const fechaHoyTexto = obtenerFechaActualTexto();
        fechaInput.min = fechaHoyTexto;

        fechaInput.addEventListener('change', () => {
            horaSelect.innerHTML = '<option value="">Selecciona un horario</option>';

            const fechaSeleccionada = fechaInput.value;
            const horarios = generarHorarios('11:00', '20:00');

            const ahora = new Date();
            const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

            const horariosDisponibles = horarios.filter(hora => {
                const [h, m] = hora.valor.split(':').map(Number);
                const minutosHorario = h * 60 + m;

                // Si la fecha seleccionada es hoy, solo mostrar horarios futuros
                if (fechaSeleccionada === fechaHoyTexto) {
                    return minutosHorario > minutosActuales;
                }

                // Si es otro día, mostrar todos los horarios
                return true;
            });

            if (horariosDisponibles.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay horarios disponibles para hoy';
                horaSelect.appendChild(option);
                return;
            }

            horariosDisponibles.forEach(hora => {
                const option = document.createElement('option');
                option.value = hora.valor;
                option.textContent = hora.texto;
                horaSelect.appendChild(option);
            });
        });
    }

    if (formAgendar) {
        formAgendar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usuario = obtenerUsuarioGuardado();

            if (!usuario) {
                Swal.fire({
                    title: 'Inicia sesión',
                    text: 'Para agendar una cita primero debes iniciar sesión.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
                return;
            }

            const servicio = document.getElementById('servicio').value;
            const barbero = document.getElementById('barbero').value;
            const fecha = document.getElementById('fecha').value;
            const hora = document.getElementById('hora').value;
            const comentarios = document.getElementById('comentarios').value.trim();

            if (!servicio || !barbero || !fecha || !hora) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Completa todos los campos obligatorios para agendar tu cita.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
                return;
            }

            // Validación extra: no permitir agendar horarios pasados del día actual
            const fechaActualTexto = obtenerFechaActualTexto();
            const ahora = new Date();

            const [horaSeleccionada, minutoSeleccionado] = hora.split(':').map(Number);
            const minutosSeleccionados = horaSeleccionada * 60 + minutoSeleccionado;
            const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

            if (fecha === fechaActualTexto && minutosSeleccionados <= minutosActuales) {
                Swal.fire({
                    title: 'Horario no disponible',
                    text: 'No puedes agendar una cita en un horario que ya pasó.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
                return;
            }

            try {
                const respuesta = await fetch('/api/agendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idUsuario: usuario.ID_Usuario,
                        servicio,
                        barbero,
                        fecha,
                        hora,
                        comentarios
                    })
                });

                const data = await respuesta.json();

                if (data.success) {
                    Swal.fire({
                        title: '¡Cita agendada!',
                        text: data.mensaje,
                        icon: 'success',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#D4AF37'
                    }).then(() => {
                        formAgendar.reset();

                        if (horaSelect) {
                            horaSelect.innerHTML = '<option value="">Primero selecciona una fecha</option>';
                        }
                    });

                } else {
                    Swal.fire({
                        title: 'No se pudo agendar',
                        text: data.detalle ? `${data.mensaje} Detalle: ${data.detalle}` : data.mensaje,
                        icon: 'warning',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#D4AF37'
                    });
                }

            } catch (error) {
                console.error('Error al agendar:', error);

                Swal.fire({
                    title: 'Error de servidor',
                    text: 'No se pudo conectar con el servidor para registrar la cita.',
                    icon: 'error',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#D4AF37'
                });
            }
        });
    }

    // --- 7. LÓGICA DE RECUPERAR CONTRASEÑA ---
    const formRecuperarPassword = document.getElementById('formRecuperarPassword');

    if (formRecuperarPassword) {
        formRecuperarPassword.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correoRecuperar').value.trim();
            const nuevaPassword = document.getElementById('nuevaPassword').value.trim();
            const confirmarPassword = document.getElementById('confirmarPassword').value.trim();

            if (!correo || !nuevaPassword || !confirmarPassword) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Completa todos los campos para actualizar tu contraseña.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#4a3506'
                });
                return;
            }

            if (nuevaPassword !== confirmarPassword) {
                Swal.fire({
                    title: 'Contraseñas diferentes',
                    text: 'La nueva contraseña y la confirmación no coinciden.',
                    icon: 'warning',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#4a3506'
                });
                return;
            }

            try {
                const respuesta = await fetch('/api/recuperar-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        correo,
                        nuevaPassword,
                        confirmarPassword
                    })
                });

                const data = await respuesta.json();

                if (data.success) {
                    Swal.fire({
                        title: 'Contraseña actualizada',
                        text: data.mensaje,
                        icon: 'success',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#4a3506',
                        confirmButtonText: 'Ir al login'
                    }).then(() => {
                        window.location.href = '/login.html';
                    });
                } else {
                    Swal.fire({
                        title: 'No se pudo actualizar',
                        text: data.mensaje,
                        icon: 'warning',
                        background: '#121212',
                        color: '#ffffff',
                        confirmButtonColor: '#4a3506'
                    });
                }

            } catch (error) {
                console.error('Error al recuperar contraseña:', error);

                Swal.fire({
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor.',
                    icon: 'error',
                    background: '#121212',
                    color: '#ffffff',
                    confirmButtonColor: '#4a3506'
                });
            }
        });
    }
});