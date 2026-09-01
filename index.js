require('dotenv').config();
// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

console.log('DATABASE_URL cargada:', !!process.env.DATABASE_URL);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Probar conexión a la base de datos
pool.connect()
    .then(client => {
        console.log('Conectado a PostgreSQL exitosamente');
        client.release();
    })
    .catch(err => {
        console.error('Error al conectar con PostgreSQL:', err);
    });

// --- RUTA PARA REGISTRAR USUARIO ---
app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, correo, password } = req.body;

    if (!nombre || !apellido || !correo || !password) {
        return res.json({
            success: false,
            mensaje: 'Completa todos los campos.'
        });
    }

    try {
        const checkResult = await pool.query(
            'SELECT * FROM usuarios WHERE correo = $1',
            [correo]
        );

        if (checkResult.rows.length > 0) {
            return res.json({
                success: false,
                mensaje: 'Este correo ya está registrado.'
            });
        }

        await pool.query(
            `
            INSERT INTO usuarios (nombre, apellido, correo, password, rol)
            VALUES ($1, $2, $3, $4, 'cliente')
            `,
            [nombre, apellido, correo, password]
        );

        res.json({
            success: true,
            mensaje: '¡Cuenta creada con éxito!'
        });

    } catch (err) {
        console.error('Error en el registro:', err);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor.',
            detalle: err.message
        });
    }
});

// --- RUTA PARA INICIAR SESIÓN ---
app.post('/api/login', async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.json({
            success: false,
            mensaje: 'Ingresa tu correo y contraseña.'
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT 
                id_usuario AS "ID_Usuario",
                nombre AS "Nombre",
                apellido AS "Apellido",
                rol AS "Rol"
            FROM usuarios
            WHERE correo = $1 AND password = $2
            `,
            [correo, password]
        );

        if (result.rows.length > 0) {
            res.json({
                success: true,
                usuario: result.rows[0]
            });
        } else {
            res.json({
                success: false,
                mensaje: 'Correo o contraseña incorrectos.'
            });
        }

    } catch (err) {
        console.error('Error en el login:', err);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor.',
            detalle: err.message
        });
    }
});

// --- RUTA PARA RECUPERAR / ACTUALIZAR CONTRASEÑA ---
app.post('/api/recuperar-password', async (req, res) => {
    const { correo, nuevaPassword, confirmarPassword } = req.body;

    if (!correo || !nuevaPassword || !confirmarPassword) {
        return res.json({
            success: false,
            mensaje: 'Completa todos los campos.'
        });
    }

    if (nuevaPassword !== confirmarPassword) {
        return res.json({
            success: false,
            mensaje: 'Las contraseñas no coinciden.'
        });
    }

    try {
        const usuarioExiste = await pool.query(
            'SELECT * FROM usuarios WHERE correo = $1',
            [correo]
        );

        if (usuarioExiste.rows.length === 0) {
            return res.json({
                success: false,
                mensaje: 'No existe una cuenta registrada con ese correo.'
            });
        }

        await pool.query(
            `
            UPDATE usuarios
            SET password = $1
            WHERE correo = $2
            `,
            [nuevaPassword, correo]
        );

        res.json({
            success: true,
            mensaje: 'Contraseña actualizada correctamente.'
        });

    } catch (err) {
        console.error('Error al recuperar contraseña:', err);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor.',
            detalle: err.message
        });
    }
});

// --- RUTA PARA AGENDAR CITA ---
app.post('/api/agendar', async (req, res) => {
    const { idUsuario, servicio, barbero, fecha, hora, comentarios } = req.body;

    if (!idUsuario || !servicio || !barbero || !fecha || !hora) {
        return res.json({
            success: false,
            mensaje: 'Faltan datos obligatorios para registrar la cita.'
        });
    }

    try {
        const citaExistente = await pool.query(
            `
            SELECT * FROM citas
            WHERE barbero = $1
            AND fecha = $2
            AND hora = $3
            `,
            [barbero, fecha, hora]
        );

        if (citaExistente.rows.length > 0) {
            return res.json({
                success: false,
                mensaje: 'Ese horario ya está ocupado con el barbero seleccionado. Elige otro horario.'
            });
        }

        await pool.query(
            `
            INSERT INTO citas (id_usuario, servicio, barbero, fecha, hora, comentarios, estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'Pendiente')
            `,
            [idUsuario, servicio, barbero, fecha, hora, comentarios || '']
        );

        res.json({
            success: true,
            mensaje: '¡Cita agendada correctamente!'
        });

    } catch (err) {
        console.error('Error al agendar cita:', err);

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor al registrar la cita.',
            detalle: err.message
        });
    }
});

// --- RUTA PARA MOSTRAR TODAS LAS CITAS AL ADMIN ---
app.get('/api/admin/citas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.id_cita AS "ID_Cita",
                u.nombre AS "Nombre",
                u.apellido AS "Apellido",
                u.correo AS "Correo",
                c.servicio AS "Servicio",
                c.barbero AS "Barbero",
                c.fecha AS "Fecha",
                c.hora AS "Hora",
                c.comentarios AS "Comentarios",
                c.estado AS "Estado",
                c.fecha_registro AS "FechaRegistro"
            FROM citas c
            INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
            ORDER BY c.fecha DESC, c.hora DESC
        `);

        res.json({
            success: true,
            citas: result.rows
        });

    } catch (err) {
        console.error('Error al obtener citas:', err);

        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las citas.',
            detalle: err.message
        });
    }
});

// Ruta de prueba
app.get('/api/prueba', (req, res) => {
    res.json({
        success: true,
        mensaje: 'Servidor de la barbería funcionando correctamente.'
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('¡Servidor de la Barbería funcionando al 100!');
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});