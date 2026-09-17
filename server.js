import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(db) {

    const app = express();

    app.use(express.json());

    // Serve React/HTML/CSS/JS
    app.use(express.static(path.join(__dirname, 'src')));

    // Home
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'src', 'index.html'));
    });


    // =========================
    // GET CLIENTS
    // =========================

    app.get('/clients', (req, res) => {

        try {

            const query = `
                SELECT *
                FROM clients
                ORDER BY created_at DESC
            `;

            const rows = db.prepare(query).all();

            res.json(rows);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    });


    // =========================
    // GET SETTINGS
    // =========================

    app.get('/setting', (req, res) => {

        try {

            const query = `
                SELECT *
                FROM setting
            `;

            const rows = db.prepare(query).all();

            res.json(rows);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });
        }
    });


    // =========================
    // UPDATE SETTINGS
    // =========================

    app.put('/setting', (req, res) => {

        try {

            const { salle_name } = req.body;

            if (!salle_name || !salle_name.trim()) {

                return res.status(400).json({
                    success: false,
                    message: 'Salle name is required'
                });
            }

            const query = `
                UPDATE setting
                SET salle_name = ?
            `;

            db.prepare(query).run(
                salle_name.trim()
            );

            res.json({
                success: true,
                message: 'Settings updated successfully'
            });

        } catch (err) {

            console.error(
                'UPDATE SETTING ERROR:',
                err
            );

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });


    // =========================
    // ADD CLIENT
    // =========================

    app.post('/addClients', (req, res) => {

        try {

            const newClient = req.body;

            const query = `
                INSERT INTO clients
                (
                    name,
                    phone,
                    plan,
                    start_date,
                    end_date,
                    amount,
                    duration_months
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const result = db.prepare(query).run(
                newClient.name,
                newClient.phone,
                newClient.plan,
                newClient.start_date,
                newClient.end_date,
                newClient.amount,
                newClient.durationMonths
            );

            console.log('INSERTED:', result);

            res.status(201).json({
                success: true,
                message: 'Client added successfully'
            });

        } catch (err) {

            console.error(
                'ADD CLIENT ERROR:',
                err
            );

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });


    // =========================
    // RENEW CLIENT
    // =========================

    app.put('/ReNew', (req, res) => {

        const targetClient = req.body;

        try {

            const currentClient = db
                .prepare(
                    'SELECT * FROM clients WHERE id = ?'
                )
                .get(targetClient.id);

            if (!currentClient) {

                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            const nextDuration =
                Number(currentClient.duration_months || 0) +
                Number(targetClient.durationMonths || 0);

            const nextAmount =
                Number(targetClient.amount || 0);

            const nextStartDate =
                targetClient.start_date ||
                currentClient.start_date;

            const nextEndDate =
                targetClient.end_date ||
                currentClient.end_date;

            const query = `
                UPDATE clients
                SET
                    duration_months = ?,
                    amount = ?,
                    start_date = ?,
                    end_date = ?
                WHERE id = ?
            `;

            const result = db.prepare(query).run(
                nextDuration,
                nextAmount,
                nextStartDate,
                nextEndDate,
                targetClient.id
            );

            if (result.changes === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                message: 'Client renewal updated successfully'
            });

        } catch (err) {

            console.error(
                'UPDATE CLIENT ERROR:',
                err
            );

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });


    // =========================
    // DELETE CLIENT
    // =========================

    app.delete('/deleteClient', (req, res) => {

        const targetId = req.body;

        try {

            const query = `
                DELETE FROM clients
                WHERE id = ?
            `;

            const result = db
                .prepare(query)
                .run(targetId.id);

            if (result.changes === 0) {

                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.json({
                success: true,
                message: 'Client deleted successfully'
            });

        } catch (err) {

            console.error(
                'DELETE CLIENT ERROR:',
                err
            );

            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    });


    return app;
}