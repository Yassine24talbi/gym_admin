import { app, BrowserWindow } from 'electron';
import agk from 'electron-updater';
const { autoUpdater } = agk
import path from 'path';
import { fileURLToPath } from 'url';

import { createDatabase } from './db.js';
import { createServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let server;
let db;


// ==========================================
// AUTO UPDATE SETTINGS
// ==========================================

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// ==========================================
// CREATE WINDOW
// ==========================================

function createWindow() {

    mainWindow = new BrowserWindow({

        width: 1080,
        height: 700,

        minWidth: 800,
        minHeight: 550,

        fullscreen: true,

        icon: path.join(
            __dirname,
            'icon.ico'
        ),

        title: 'Gym Admin',

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });


    mainWindow.loadURL(
        'http://127.0.0.1:4500'
    );


    // Escape = exit fullscreen
    mainWindow.webContents.on(
        'before-input-event',
        (event, input) => {

            if (
                input.type === 'keyDown' &&
                input.key === 'Escape'
            ) {

                event.preventDefault();

                mainWindow.setFullScreen(false);

                mainWindow.setSize(
                    1280,
                    800
                );

                mainWindow.center();
            }
        }
    );


    mainWindow.on('closed', () => {

        mainWindow = null;

    });
}


// ==========================================
// APP READY
// ==========================================

app.whenReady().then(() => {

    console.log('==============================');
    console.log('Starting Gym Admin');
    console.log('Version:', app.getVersion());
    console.log('==============================');


    // ======================================
    // DATABASE
    // ======================================

    const databasePath = app.isPackaged

        ? path.join(
            app.getPath('userData'),
            'database.db'
        )

        : path.join(
            __dirname,
            'database.db'
        );


    console.log(
        'Database:',
        databasePath
    );


    try {

        db = createDatabase(
            databasePath
        );

        console.log(
            'SQLite database ready'
        );

    } catch (error) {

        console.error(
            'DATABASE ERROR:',
            error
        );

        app.quit();

        return;
    }


    // ======================================
    // EXPRESS SERVER
    // ======================================

    try {

        server = createServer(db);

        console.log(
            'Express server created'
        );

    } catch (error) {

        console.error(
            'EXPRESS ERROR:',
            error
        );

        if (db) {
            db.close();
        }

        app.quit();

        return;
    }


    // ======================================
    // START SERVER
    // ======================================

    server.listen(
        4500,
        '127.0.0.1',
        () => {

            console.log(
                'Server running at http://127.0.0.1:4500'
            );

            // Create Electron window
            createWindow();

            // Check GitHub for updates
            autoUpdater.checkForUpdates();
        }
    );


    // ======================================
    // WINDOW CLOSED
    // ======================================

    app.on(
        'window-all-closed',
        () => {

            if (server) {

                server = null;
            }


            if (db) {

                db.close();

                db = null;
            }


            if (process.platform !== 'darwin') {

                app.quit();

            }

        }
    );


    // ======================================
    // BEFORE QUIT
    // ======================================

    app.on(
        'before-quit',
        () => {

            if (server) {

                server.close();

                server = null;
            }


            if (db) {

                db.close();

                db = null;
            }

        }
    );

});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

process.on(
    'uncaughtException',
    (error) => {

        console.error(
            'UNCAUGHT EXCEPTION:',
            error
        );

    }
);