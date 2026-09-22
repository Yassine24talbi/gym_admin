import { app, BrowserWindow, dialog } from 'electron';
import agk from 'electron-updater';
const { autoUpdater } = agk;

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
// AUTO UPDATE EVENTS
// ==========================================

autoUpdater.on('update-available', (info) => {

    dialog.showMessageBox({
        type: 'info',
        title: 'Gym Admin Update',
        message: 'A new update is available.',
        detail:
            `Current version: ${app.getVersion()}\n` +
            `New version: ${info.version}\n\n` +
            `The update will download automatically.`
    });

});


autoUpdater.on('update-downloaded', (info) => {


    dialog.showMessageBox({
        type: 'info',
        title: 'Gym Admin Update',
        message: 'Update downloaded successfully.',
        detail:
            `Version ${info.version} is ready to install.\n\n` +
            `The update will be installed when you close Gym Admin.`
    });

});


autoUpdater.on('error', (error) => {

    console.error(
        'AUTO UPDATE ERROR:',
        error
    );

    dialog.showMessageBox({
        type: 'error',
        title: 'Gym Admin Update Error',
        message: 'There was a problem checking for updates.',
        detail: error.message || String(error)
    });

});


// ==========================================
// CHECK FOR UPDATES
// ==========================================

async function checkForUpdates() {

    if (!app.isPackaged) {

        console.log(
            'Auto update disabled in development mode.'
        );

        return;

    }


    console.log(
        '================================'
    );

    console.log(
        'AUTO UPDATE'
    );

    console.log(
        'Current version:',
        app.getVersion()
    );

    console.log(
        'Checking GitHub...'
    );

    console.log(
        '================================'
    );


    try {

        await autoUpdater.checkForUpdates();

    } catch (error) {

        console.error(
            'Failed to check for updates:',
            error
        );

    }

}


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
    console.log('Packaged:', app.isPackaged);
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
            checkForUpdates();

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